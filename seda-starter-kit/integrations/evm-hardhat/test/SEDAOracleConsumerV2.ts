import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('SEDAOracleConsumerV2', () => {
  const ORACLE_PROGRAM_ID = ethers.ZeroHash;
  const STALE_SECONDS = 60;
  const MAX_FUTURE_DRIFT = 30;
  const PAIR = ethers.keccak256(ethers.toUtf8Bytes('WCRO-USDC'));

  async function deployFixture() {
    const [owner, relayer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('SEDAOracleConsumerV2');
    const consumer = await factory.deploy(ORACLE_PROGRAM_ID, relayer.address, STALE_SECONDS, MAX_FUTURE_DRIFT);
    return { consumer, owner, relayer, other };
  }

  function validValues() {
    return [1n, 900_000n, 1n, 0n] as const;
  }

  it('allows owner to set relayer and pairs', async () => {
    const { consumer, owner, other } = await deployFixture();
    const oldRelayer = await consumer.relayer();
    await expect(consumer.connect(other).setRelayer(other.address)).to.be.revertedWithCustomError(
      consumer,
      'NotOwner',
    );
    await expect(consumer.connect(owner).setRelayer(other.address))
      .to.emit(consumer, 'RelayerUpdated')
      .withArgs(oldRelayer, other.address);
    await expect(consumer.connect(owner).setPairAllowed(PAIR, true))
      .to.emit(consumer, 'PairAllowed')
      .withArgs(PAIR, true);
  });

  it('rejects submit from non-relayer', async () => {
    const { consumer, owner, other } = await deployFixture();
    await consumer.connect(owner).setPairAllowed(PAIR, true);
    await expect(
      consumer.connect(other).submitResult(ethers.keccak256(ethers.toUtf8Bytes('req1')), PAIR, validValues(), '0x'),
    ).to.be.revertedWithCustomError(consumer, 'NotRelayer');
  });

  it('enforces allowlist and replay protection', async () => {
    const { consumer, relayer, owner } = await deployFixture();
    const requestId = ethers.keccak256(ethers.toUtf8Bytes('req1'));
    await expect(
      consumer.connect(relayer).submitResult(requestId, PAIR, validValues(), '0x'),
    ).to.be.revertedWithCustomError(consumer, 'PairNotAllowed');

    await consumer.connect(owner).setPairAllowed(PAIR, true);
    await consumer.connect(relayer).submitResult(requestId, PAIR, validValues(), '0x');

    await expect(
      consumer.connect(relayer).submitResult(requestId, PAIR, validValues(), '0x'),
    ).to.be.revertedWithCustomError(consumer, 'DuplicateRequestForPair');

    const anotherPair = ethers.keccak256(ethers.toUtf8Bytes('ETH-USDC'));
    await consumer.connect(owner).setPairAllowed(anotherPair, true);
    await expect(
      consumer.connect(relayer).submitResult(requestId, anotherPair, validValues(), '0x'),
    ).to.be.revertedWithCustomError(consumer, 'AlreadyProcessed');
  });

  it('validates oracle value ranges', async () => {
    const { consumer, relayer, owner } = await deployFixture();
    await consumer.connect(owner).setPairAllowed(PAIR, true);
    const requestId = ethers.keccak256(ethers.toUtf8Bytes('req2'));

    await expect(
      consumer.connect(relayer).submitResult(requestId, PAIR, [0n, 1n, 1n, 0n], '0x'),
    ).to.be.revertedWithCustomError(consumer, 'InvalidOracleValue');

    await expect(
      consumer.connect(relayer).submitResult(requestId, PAIR, [1n, 1_000_001n, 1n, 0n], '0x'),
    ).to.be.revertedWithCustomError(consumer, 'InvalidOracleValue');

    await expect(
      consumer.connect(relayer).submitResult(requestId, PAIR, [1n, 1n, -1n, 0n], '0x'),
    ).to.be.revertedWithCustomError(consumer, 'InvalidOracleValue');

    await expect(
      consumer.connect(relayer).submitResult(requestId, PAIR, [1n, 1n, 1n, 8n], '0x'),
    ).to.be.revertedWithCustomError(consumer, 'InvalidOracleValue');
  });

  it('updates metadata and seq', async () => {
    const { consumer, relayer, owner } = await deployFixture();
    await consumer.connect(owner).setPairAllowed(PAIR, true);
    const requestId1 = ethers.keccak256(ethers.toUtf8Bytes('req3'));
    const requestId2 = ethers.keccak256(ethers.toUtf8Bytes('req4'));

    await consumer.connect(relayer).submitResult(requestId1, PAIR, validValues(), '0x');
    const updatedAt1 = await consumer.updatedAtByPair(PAIR);
    const seq1 = await consumer.seqByPair(PAIR);
    expect(updatedAt1).to.be.gt(0n);
    expect(seq1).to.equal(1n);

    await consumer.connect(relayer).submitResult(requestId2, PAIR, validValues(), '0x');
    const seq2 = await consumer.seqByPair(PAIR);
    expect(seq2).to.equal(2n);
  });

  it('enforces staleSeconds bounds and computes staleness', async () => {
    const { consumer, relayer, owner } = await deployFixture();
    await consumer.connect(owner).setPairAllowed(PAIR, true);

    await expect(consumer.connect(owner).setStaleSeconds(5)).to.be.revertedWithCustomError(
      consumer,
      'BadParams',
    );
    await expect(consumer.connect(owner).setStaleSeconds(2 * 24 * 60 * 60)).to.be.revertedWithCustomError(
      consumer,
      'BadParams',
    );

    const requestId = ethers.keccak256(ethers.toUtf8Bytes('req5'));
    await consumer.connect(relayer).submitResult(requestId, PAIR, validValues(), '0x');
    expect(await consumer.isStale(PAIR)).to.equal(false);

    await ethers.provider.send('evm_increaseTime', [STALE_SECONDS + 1]);
    await ethers.provider.send('evm_mine', []);
    expect(await consumer.isStale(PAIR)).to.equal(true);
  });
});

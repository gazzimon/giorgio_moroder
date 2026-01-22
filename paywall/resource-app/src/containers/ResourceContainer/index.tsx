import { useEffect, useMemo, useState } from 'react';
import { DataViewer } from '../../components/DataViewer';
import { useX402Flow } from '../../hooks/useX402Flow';
import { createApiClient } from '../../integration/api';
import {
  Badge,
  AmountField,
  AmountGrid,
  AmountLabel,
  ButtonRow,
  ContentGrid,
  GhostButton,
  Hero,
  Brand,
  BrandLogo,
  BrandName,
  BrandTag,
  BrandText,
  PanelSection,
  SectionLabel,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
  SummaryMeta,
  SummaryValue,
  TopBar,
  TopLink,
  TopLinks,
  MetaItem,
  MetaKey,
  MetaLink,
  MetaGrid,
  MetaValue,
  PairChip,
  PairGrid,
  Panel,
  PanelHeader,
  PanelTitle,
  PrimaryButton,
  ResultCard,
  ResultLabel,
  StatCard,
  StatLabel,
  StatRow,
  StatValue,
  StatusPill,
  StepItem,
  Steps,
  StyledContainer,
  Subtitle,
  Title,
} from './styles';

export interface ResourceContainerProps {
  apiBase: string;
}

export function ResourceContainer(props: ResourceContainerProps): JSX.Element {
  const { status, data, paymentId, feeUSDC, isBusy, fetchSecret, retryWithPaymentId } = useX402Flow({
    apiBase: props.apiBase,
  });
  const api = useMemo(() => createApiClient({ apiBase: props.apiBase }), [props.apiBase]);
  const pairs = useMemo(() => ['WCRO-USDC'], []);
  const [pair, setPair] = useState<string>(pairs[0] ?? '');
  const [amountUSDC, setAmountUSDC] = useState<string>('0');
  const [amountTCRO, setAmountTCRO] = useState<string>('0');
  const [latestPayload, setLatestPayload] = useState<Record<string, unknown> | null>(null);
  const [latestData, setLatestData] = useState<string>('');

  const toBaseUnits = (value: string, decimals: number): string => {
    const trimmed = value.trim();
    if (!trimmed) return '0';
    if (!/^\d+(\.\d+)?$/.test(trimmed)) return '0';
    const [wholeRaw, fracRaw = ''] = trimmed.split('.');
    const whole = wholeRaw.replace(/^0+/, '') || '0';
    const frac = fracRaw.slice(0, decimals).padEnd(decimals, '0');
    return `${whole}${frac}`.replace(/^0+/, '') || '0';
  };

  const payload = useMemo(() => {
    if (!data) return null;
    try {
      return JSON.parse(data) as {
        pair?: string;
        fairPrice?: string;
        fairPriceScaled?: string;
        confidenceScore?: string;
        confidenceScoreScaled?: string;
        maxSafeExecutionSize?: string;
        maxSafeExecutionSizeScaled?: string;
        flags?: string;
        sedaExplorerUrl?: string | null;
        cronosTxHash?: string | null;
        sedaRequestId?: string | null;
      };
    } catch {
      return null;
    }
  }, [data]);

  const latestParsed = useMemo(() => {
    if (!latestPayload) return null;
    return latestPayload as {
      pair?: string;
      fairPrice?: string;
      fairPriceScaled?: string;
      confidenceScore?: string;
      confidenceScoreScaled?: string;
      maxSafeExecutionSize?: string;
      maxSafeExecutionSizeScaled?: string;
      flags?: string;
      sedaExplorerUrl?: string | null;
      cronosTxHash?: string | null;
      sedaRequestId?: string | null;
    };
  }, [latestPayload]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const result = await api.getLatest(pair);
      if (!active) return;
      if (result.kind === 'ok' && result.data?.ok) {
        setLatestPayload(result.data);
        setLatestData(JSON.stringify(result.data, null, 2));
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [api, pair]);

  const displayPayload = payload ?? latestParsed;
  const displayData = data || latestData;

  const cronosLink = displayPayload?.cronosTxHash
    ? `https://explorer.cronos.org/testnet/tx/${displayPayload.cronosTxHash}`
    : null;

  const feeLabel = useMemo(() => {
    if (!feeUSDC) return '--';
    const raw = feeUSDC.replace(/[^0-9]/g, '');
    if (!raw) return feeUSDC;
    const padded = raw.padStart(7, '0');
    const whole = padded.slice(0, -6) || '0';
    const fraction = padded.slice(-6);
    return `${whole}.${fraction}`;
  }, [feeUSDC]);

  const activeStep = useMemo(() => {
    const norm = status.toLowerCase();
    if (norm.includes('requesting')) return 0;
    if (norm.includes('payment required')) return 1;
    if (norm.includes('signing')) return 2;
    if (norm.includes('sending')) return 3;
    if (norm.includes('access granted')) return 4;
    return -1;
  }, [status]);

  const tone = status.includes('Access granted')
    ? 'success'
    : status.includes('Payment required')
      ? 'warn'
      : 'neutral';

  return (
    <StyledContainer>
      <TopBar>
        <Brand>
          <BrandLogo src="/logo-icon.svg" alt="Giorgio Moroder logo" />
          <BrandText>
            <BrandName>GIORGIO MORODER</BrandName>
            <BrandTag>Oracle Paywall Console</BrandTag>
          </BrandText>
        </Brand>
        <TopLinks>
          <TopLink href="/">Landing</TopLink>
          <TopLink href="https://github.com/gazzimon/giorgio_moroder" target="_blank" rel="noreferrer">
            GitHub
          </TopLink>
        </TopLinks>
      </TopBar>
      <ContentGrid>
        <Hero>
          <Badge>SEDA / x402 / Cronos</Badge>
          <Title>Execution-grade pricing, unlocked via pay-per-query access.</Title>
          <Subtitle>
            Select the pair, sign the EIP-3009 payment, and re-fetch the payload. Each request is
            settled on Cronos and verified by SEDA recomputation.
          </Subtitle>
          <StatRow>
            <StatCard>
              <StatLabel>Protocol</StatLabel>
              <StatValue>x402 + EIP-3009</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Network</StatLabel>
              <StatValue>Cronos Testnet</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Oracle</StatLabel>
              <StatValue>SEDA Compute</StatValue>
            </StatCard>
          </StatRow>
        </Hero>

        <Panel>
          <PanelHeader>
            <PanelTitle>Oracle Console</PanelTitle>
            <StatusPill tone={tone}>Status: {status || 'Idle'}</StatusPill>
          </PanelHeader>

          <PanelSection>
            <SectionLabel>Market pair</SectionLabel>
            <PairGrid>
              {pairs.map((item) => (
                <PairChip key={item} active={pair === item} onClick={() => setPair(item)}>
                  {item}
                </PairChip>
              ))}
            </PairGrid>
          </PanelSection>

          <PanelSection>
            <SectionLabel>Payment intent</SectionLabel>
            <AmountGrid>
              <div>
                <AmountLabel>devUSDC.e</AmountLabel>
                <AmountField
                  inputMode="decimal"
                  value={amountUSDC}
                  onChange={(event) => setAmountUSDC(event.target.value)}
                  placeholder="USDC amount"
                />
              </div>
              <div>
                <AmountLabel>TCRO</AmountLabel>
                <AmountField
                  inputMode="decimal"
                  value="0"
                  onChange={() => setAmountTCRO('0')}
                  placeholder="TCRO disabled (MVP)"
                  disabled
                />
              </div>
            </AmountGrid>
          </PanelSection>

          <ButtonRow>
            <PrimaryButton
              onClick={() =>
                void fetchSecret(pair, undefined, {
                  amountUSDC: toBaseUnits(amountUSDC, 6),
                  amountTCRO: '0',
                })
              }
              disabled={isBusy}
            >
              {isBusy ? 'Working...' : 'Fetch Price'}
            </PrimaryButton>
            <GhostButton onClick={() => void retryWithPaymentId()} disabled={!paymentId || isBusy}>
              Retry with paymentId
            </GhostButton>
          </ButtonRow>

          <Steps>
            {['Request', '402 Challenge', 'Signature', 'Settlement', 'Unlocked'].map(
              (label, index) => (
                <StepItem key={label} active={index === activeStep}>
                  {index + 1}. {label}
                </StepItem>
              )
            )}
          </Steps>
        </Panel>
      </ContentGrid>

      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Pair</SummaryLabel>
          <SummaryValue>{displayPayload?.pair ?? pair}</SummaryValue>
          <SummaryMeta>Active market</SummaryMeta>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Fair Price</SummaryLabel>
          <SummaryValue>{displayPayload?.fairPrice ?? '--'}</SummaryValue>
          <SummaryMeta>scaled {displayPayload?.fairPriceScaled ?? '--'}</SummaryMeta>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Confidence</SummaryLabel>
          <SummaryValue>{displayPayload?.confidenceScore ?? '--'}</SummaryValue>
          <SummaryMeta>scaled {displayPayload?.confidenceScoreScaled ?? '--'}</SummaryMeta>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Max Size</SummaryLabel>
          <SummaryValue>{displayPayload?.maxSafeExecutionSize ?? '--'}</SummaryValue>
          <SummaryMeta>scaled {displayPayload?.maxSafeExecutionSizeScaled ?? '--'}</SummaryMeta>
        </SummaryCard>
      </SummaryGrid>

      <ResultCard>
        <ResultLabel>Latest Payload</ResultLabel>
        <DataViewer data={displayData} />
        <MetaGrid>
          <MetaItem>
            <MetaKey>Flags</MetaKey>
            <MetaValue>{displayPayload?.flags ?? '--'}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaKey>SEDA</MetaKey>
            {displayPayload?.sedaExplorerUrl ? (
              <MetaLink href={displayPayload.sedaExplorerUrl} target="_blank" rel="noreferrer">
                View consensus
              </MetaLink>
            ) : (
              <MetaValue>--</MetaValue>
            )}
          </MetaItem>
          <MetaItem>
            <MetaKey>Cronos Tx</MetaKey>
            {cronosLink ? (
              <MetaLink href={cronosLink} target="_blank" rel="noreferrer">
                {displayPayload?.cronosTxHash}
              </MetaLink>
            ) : (
              <MetaValue>--</MetaValue>
            )}
          </MetaItem>
          <MetaItem>
            <MetaKey>Fee (USDC)</MetaKey>
            <MetaValue>{feeLabel}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaKey>paymentId</MetaKey>
            <MetaValue>{paymentId || '--'}</MetaValue>
          </MetaItem>
        </MetaGrid>
      </ResultCard>
    </StyledContainer>
  );
}

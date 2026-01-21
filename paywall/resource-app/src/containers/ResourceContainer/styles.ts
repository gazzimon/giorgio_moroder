import styled from 'styled-components';

export const StyledContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  justify-content: flex-start;
  padding: 32px 20px 80px;
`;

export const ContentGrid = styled.div`
  width: min(1200px, 100%);
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const TopBar = styled.div`
  width: min(1200px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(10, 14, 20, 0.8);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const BrandLogo = styled.img`
  width: 38px;
  height: 38px;
  object-fit: contain;
`;

export const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const BrandName = styled.span`
  font-weight: 700;
  letter-spacing: 0.08em;
  font-size: 0.9rem;
`;

export const BrandTag = styled.span`
  font-size: 0.75rem;
  color: var(--muted);
`;

export const TopLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const TopLink = styled.a`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0, 255, 157, 0.3);
  color: var(--text);
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: border 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: rgba(0, 255, 157, 0.7);
    color: var(--accent);
  }
`;

export const Hero = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: linear-gradient(120deg, rgba(0, 255, 157, 0.2), rgba(59, 130, 246, 0.2));
  border: 1px solid rgba(0, 255, 157, 0.35);
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.2px;
  width: fit-content;
`;

export const Title = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.4rem, 4vw, 3.4rem);
  line-height: 1.05;
  margin: 0;
`;

export const Subtitle = styled.p`
  margin: 0;
  color: var(--muted);
  font-size: 1.05rem;
  max-width: 560px;
`;

export const StatRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const StatCard = styled.div`
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(19, 22, 28, 0.85);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  min-width: 170px;
`;

export const StatLabel = styled.div`
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
`;

export const StatValue = styled.div`
  font-size: 1.4rem;
  font-weight: 600;
`;

export const Panel = styled.section`
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 28px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  font-family: 'Space Grotesk', sans-serif;
`;

export const StatusPill = styled.div<{ tone?: 'neutral' | 'success' | 'warn' }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  color: ${({ tone }) => (tone === 'success' ? '#061812' : '#0a111a')};
  background: ${({ tone }) =>
    tone === 'success'
      ? 'linear-gradient(90deg, #16e0a0, #00ff9d)'
      : tone === 'warn'
        ? 'linear-gradient(90deg, #f59e0b, #ffcf6a)'
        : 'linear-gradient(90deg, rgba(0,255,157,0.4), rgba(59,130,246,0.4))'};
`;

export const PanelSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SectionLabel = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--muted);
`;

export const PairGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const PairChip = styled.button<{ active?: boolean }>`
  border-radius: 999px;
  padding: 8px 14px;
  border: 1px solid ${({ active }) => (active ? 'rgba(0,255,157,0.6)' : 'transparent')};
  background: ${({ active }) =>
    active ? 'rgba(0, 255, 157, 0.2)' : 'rgba(14, 24, 43, 0.7)'};
  color: ${({ active }) => (active ? 'var(--accent)' : 'var(--muted)')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--accent);
    border-color: rgba(0, 255, 157, 0.4);
  }
`;

export const PairInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(10, 14, 20, 0.9);
  color: var(--text);
  font-size: 1rem;

  &::placeholder {
    color: rgba(154, 176, 200, 0.7);
  }
`;

export const AmountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

export const AmountField = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(10, 14, 20, 0.9);
  color: var(--text);
  font-size: 1rem;

  &::placeholder {
    color: rgba(154, 176, 200, 0.7);
  }
`;

export const AmountLabel = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 6px;
`;

export const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const PrimaryButton = styled.button<{ disabled?: boolean }>`
  flex: 1;
  min-width: 200px;
  padding: 12px 18px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(120deg, #00ff9d, #3b82f6);
  color: #061412;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(0, 255, 157, 0.3);
  }
`;

export const GhostButton = styled.button`
  min-width: 200px;
  padding: 12px 18px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(8, 12, 20, 0.5);
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: border 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: rgba(0, 255, 157, 0.4);
  }
`;

export const Steps = styled.div`
  display: grid;
  gap: 10px;
`;

export const StepItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: ${({ active }) => (active ? 'rgba(0, 255, 157, 0.16)' : 'rgba(10, 18, 34, 0.6)')};
  border: 1px solid ${({ active }) => (active ? 'rgba(0, 255, 157, 0.4)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--accent)' : 'var(--muted)')};
  font-weight: 600;
`;

export const ResultCard = styled.div`
  width: min(1200px, 100%);
  padding: 22px;
  border-radius: 18px;
  background: rgba(10, 16, 26, 0.8);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ResultLabel = styled.div`
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.7rem;
  color: var(--muted);
  margin-bottom: 10px;
`;

export const MetaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--muted);
  font-size: 0.9rem;
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
`;

export const MetaKey = styled.span`
  color: var(--muted);
  font-weight: 600;
`;

export const MetaValue = styled.span`
  color: var(--text);
`;

export const MetaLink = styled.a`
  color: var(--accent);
  font-weight: 600;
  word-break: break-all;
  text-decoration: underline;
`;

export const SummaryGrid = styled.div`
  width: min(1200px, 100%);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

export const SummaryCard = styled.div`
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(19, 22, 28, 0.9);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SummaryLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--muted);
`;

export const SummaryValue = styled.span`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
`;

export const SummaryMeta = styled.span`
  font-size: 0.85rem;
  color: var(--muted);
`;

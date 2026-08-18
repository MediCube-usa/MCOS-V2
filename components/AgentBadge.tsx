import { Logo } from '@/components/Logo';

// An agent, represented everywhere by the MCOS knot in that agent's colour with
// the name small underneath. `brand` uses the full blue→cyan mark (for Atlas).
export function AgentBadge({
  name, color, size = 34, sub, brand = false
}: { name: string; color?: string; size?: number; sub?: string; brand?: boolean }) {
  return (
    <div className="agentbadge" style={color ? { ['--ac' as string]: color } : undefined}>
      <Logo size={size} tint={brand ? undefined : color} />
      <span className="agent-name">{name}</span>
      {sub && <span className="agent-sub">{sub}</span>}
    </div>
  );
}

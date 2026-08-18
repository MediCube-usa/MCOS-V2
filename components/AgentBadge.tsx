import { Logo, LogoTint } from '@/components/Logo';

// An agent, shown as the MCOS knot in that agent's department color with the
// name small underneath. `brand` uses the full-color mark (for Atlas).
export function AgentBadge({
  name, color, size = 34, sub, brand = false
}: { name: string; color?: string; size?: number; sub?: string; brand?: boolean }) {
  return (
    <div className="agentbadge" style={color ? { ['--ac' as string]: color } : undefined}>
      {brand || !color ? <Logo size={size} /> : <LogoTint size={size} color={color} />}
      <span className="agent-name">{name}</span>
      {sub && <span className="agent-sub">{sub}</span>}
    </div>
  );
}

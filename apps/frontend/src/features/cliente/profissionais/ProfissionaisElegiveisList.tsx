import { ProfissionalElegivelCard } from './ProfissionalElegivelCard';
import type { ProfissionalDisponivel } from './types';

type ProfissionaisElegiveisListProps = {
  maxSelectedReached: boolean;
  onReadReviews: (profissional: ProfissionalDisponivel) => void;
  onToggle: (profissional: ProfissionalDisponivel) => void;
  profissionais: ProfissionalDisponivel[];
  selectedIds: number[];
};

export function ProfissionaisElegiveisList({
  maxSelectedReached,
  onReadReviews,
  onToggle,
  profissionais,
  selectedIds,
}: ProfissionaisElegiveisListProps) {
  return (
    <div className="grid gap-4">
      {profissionais.map((profissional) => {
        const selectedIndex = selectedIds.indexOf(profissional.profissionalId);
        const selected = selectedIndex >= 0;

        return (
          <ProfissionalElegivelCard
            key={profissional.profissionalId}
            disabled={maxSelectedReached}
            profissional={profissional}
            selected={selected}
            selectionOrder={selected ? selectedIndex + 1 : undefined}
            onReadReviews={onReadReviews}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}

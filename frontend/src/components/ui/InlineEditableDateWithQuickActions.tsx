import InlineEditableDate from './InlineEditableDate';
import { addDays, addMonths } from '../../utils/dates';

interface InlineEditableDateWithQuickActionsProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  className?: string;
  emptyText?: string;
}

export default function InlineEditableDateWithQuickActions({
  value,
  onSave,
  className = '',
  emptyText = 'Add follow-up date',
}: InlineEditableDateWithQuickActionsProps) {
  const handleQuickAction = async (offset: () => string) => {
    const newDate = offset();
    await onSave(newDate);
  };

  const quickActions = [
    { label: '1 day', offset: () => addDays(value, 1) },
    { label: '3 days', offset: () => addDays(value, 3) },
    { label: '1 week', offset: () => addDays(value, 7) },
    { label: '2 weeks', offset: () => addDays(value, 14) },
    { label: '1 month', offset: () => addMonths(value, 1) },
    { label: '3 months', offset: () => addMonths(value, 3) },
  ];

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <InlineEditableDate
        value={value}
        onSave={onSave}
        emptyText={emptyText}
      />
      <div className="flex flex-wrap gap-1.5">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.offset)}
            className="px-2 py-1 text-xs font-medium text-dark-400 hover:text-warm-400 hover:bg-warm-500/10 border border-dark-700 hover:border-warm-500/30 rounded transition-colors"
            title={`Move forward ${action.label}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}


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
    <div className={`bg-dark-800/50 border border-dark-700 rounded-lg p-3 ${className}`}>
      {/* Header with title */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-dark-300">Follow-up Date</h3>
      </div>
      
      {/* Date field */}
      <div className="mb-3">
        <div className="bg-dark-900/50 px-2 py-1.5 rounded border border-dark-600 min-h-[2rem] inline-flex items-center">
          <InlineEditableDate
            value={value}
            onSave={onSave}
            emptyText={emptyText}
          />
        </div>
      </div>
      
      {/* Set reminder label */}
      <div className="mb-2">
        <label className="text-xs font-medium text-dark-500">Set reminder</label>
      </div>
      
      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-1.5">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.offset)}
            className="px-2 py-1 text-xs font-medium text-dark-400 hover:text-warm-400 hover:bg-warm-500/10 border border-dark-700 hover:border-warm-500/30 rounded transition-colors"
            title={`Set follow-up date ${action.label} from now`}
          >
            +{action.label}
          </button>
        ))}
      </div>
    </div>
  );
}


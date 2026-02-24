import { addDaysFromToday, addMonthsFromToday, addWorkDaysFromToday } from '../../utils/dates';
import { cn } from '../../utils/styles';
import InlineEditableDate from './InlineEditableDate';

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
    { label: '1 day', offset: () => addWorkDaysFromToday(1) },
    { label: '3 days', offset: () => addWorkDaysFromToday(3) },
    { label: '1 week', offset: () => addDaysFromToday(7) },
    { label: '2 weeks', offset: () => addDaysFromToday(14) },
    { label: '1 month', offset: () => addMonthsFromToday(1) },
    { label: '3 months', offset: () => addMonthsFromToday(3) },
  ];

  return (
    <div className={cn('bg-dark-800/50 border border-dark-700 rounded-lg p-3', className)}>
      {/* Header with title */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-dark-300">Follow-up Date</h3>
      </div>

      {/* Date field */}
      <div className="mb-3">
        <div className="bg-dark-900/50 px-2 py-1.5 rounded border border-dark-600 min-h-[2rem] inline-flex items-center">
          <InlineEditableDate value={value} onSave={onSave} emptyText={emptyText} />
        </div>
      </div>

      {/* Set reminder label */}
      <div className="mb-2">
        <span className="text-xs font-medium text-dark-500">Set reminder</span>
      </div>

      {/* Quick action buttons */}
      <fieldset className="flex flex-wrap gap-1.5 border-0 p-0 m-0">
        <legend className="sr-only">Quick date selection</legend>
        {quickActions.map((action) => (
          <button
            type="button"
            key={action.label}
            onClick={() => handleQuickAction(action.offset)}
            className="px-2 py-1 text-xs font-medium text-dark-400 hover:text-blue-400 hover:bg-blue-500/10 border border-dark-700 hover:border-blue-500/30 rounded transition-colors"
            aria-label={`Set follow-up date ${action.label} from now`}
          >
            +{action.label}
          </button>
        ))}
      </fieldset>
    </div>
  );
}

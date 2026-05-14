import { Input } from '@/components/ui/Input';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date';
  unit?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormSchema {
  fields: FormField[];
}

interface DynamicFormProps {
  readonly schema: FormSchema;
  readonly values: Record<string, string>;
  readonly onChange: (name: string, value: string) => void;
  readonly errors?: Record<string, string>;
}

const SELECT_CLASS =
  'block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1';

export function DynamicForm({ schema, values, onChange, errors }: DynamicFormProps) {
  if (!schema?.fields?.length) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Campos específicos da categoria
      </p>
      {schema.fields.map((field) => {
        const isSelect = field.type === 'select' && field.options;
        const isTextarea = field.type === 'textarea';
        const isInput = !isSelect && !isTextarea;
        let inputType: 'number' | 'date' | 'text' = 'text';
        if (field.type === 'number') inputType = 'number';
        else if (field.type === 'date') inputType = 'date';
        return (
          <div key={field.name}>
            {isSelect && (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  id={field.name}
                  className={SELECT_CLASS}
                  value={values[field.name] ?? ''}
                  onChange={(e) => onChange(field.name, e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors?.[field.name] && (
                  <p className="text-xs text-red-600 mt-1">{errors[field.name]}</p>
                )}
              </div>
            )}
            {isTextarea && (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id={field.name}
                  rows={3}
                  className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  value={values[field.name] ?? ''}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                />
                {errors?.[field.name] && (
                  <p className="text-xs text-red-600 mt-1">{errors[field.name]}</p>
                )}
              </div>
            )}
            {isInput && (
              <div className={field.unit ? 'flex items-end gap-2' : ''}>
                <div className="flex-1">
                  <Input
                    id={field.name}
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    type={inputType}
                    step={field.type === 'number' ? '0.1' : undefined}
                    value={values[field.name] ?? ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    error={errors?.[field.name]}
                  />
                </div>
                {field.unit && (
                  <span className="text-sm text-neutral-500 pb-2">{field.unit}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { FormSchema, FormField };

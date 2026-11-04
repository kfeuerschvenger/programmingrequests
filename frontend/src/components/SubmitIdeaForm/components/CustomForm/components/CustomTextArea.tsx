import { Textarea as $Textarea, type TextareaProps as $TextareaProps } from '@mantine/core';
import { useController, type FieldValues, type UseControllerProps } from 'react-hook-form';

export type TextareaProps<T extends FieldValues> = UseControllerProps<T> &
  Omit<$TextareaProps, 'value' | 'defaultValue'>;

export default function CustomTextarea<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  shouldUnregister,
  onChange,
  ...props
}: TextareaProps<T>) {
  const {
    field: { value, onChange: fieldOnChange, ...field },
    fieldState,
  } = useController<T>({
    name,
    control,
    defaultValue,
    rules,
    shouldUnregister,
  });

  return (
    <$Textarea
      value={value}
      onChange={e => {
        fieldOnChange(e);
        onChange?.(e);
      }}
      error={fieldState.error?.message}
      {...field}
      {...props}
    />
  );
}

import { Button, Group, Space, Textarea, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import { useCreateIdea } from '@/hooks/useCreateIdea';
import { ideaSchema, type IdeaFormValues } from './ideaSchema';

const FORM_FIELDS = ['author', 'description'] as const;

export function SubmitIdeaForm() {
  const { mutate, isPending } = useCreateIdea();

  const form = useForm<IdeaFormValues>({
    mode: 'controlled',
    initialValues: { author: '', description: '' },
    validate: zod4Resolver(ideaSchema),
    validateInputOnBlur: true,
  });

  const handleSubmit = (values: IdeaFormValues) => {
    const author = values.author.trim();
    mutate(
      { author: author || undefined, description: values.description.trim() },
      {
        onSuccess: () => form.reset(),
        // The server repeats the validation, so its field errors appear next to their inputs.
        onError: error => {
          const errors: Record<string, string> = {};
          const unmapped: string[] = [];
          for (const issue of error.fieldErrors) {
            if ((FORM_FIELDS as readonly string[]).includes(issue.field)) errors[issue.field] = issue.message;
            else unmapped.push(issue.message);
          }
          form.setErrors(errors);
          // An error that belongs to no input would otherwise vanish, leaving a rejected submit with no explanation.
          if (unmapped.length > 0) {
            notifications.show({ title: 'Idea not submitted', message: unmapped.join(' '), color: 'red' });
          }
        },
      },
    );
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate aria-busy={isPending}>
      <Title order={3}>Submit your idea</Title>
      <Space h="xl" />
      <Group align="flex-start">
        <TextInput
          label="Author"
          placeholder="Author (optional)"
          type="text"
          readOnly={isPending}
          {...form.getInputProps('author')}
        />
        <Button type="submit" loading={isPending}>
          Submit
        </Button>
      </Group>
      <Space h="xl" />
      <Textarea
        label="Description"
        placeholder="Write your idea here"
        readOnly={isPending}
        autosize
        minRows={3}
        maxRows={8}
        {...form.getInputProps('description')}
      />
    </form>
  );
}

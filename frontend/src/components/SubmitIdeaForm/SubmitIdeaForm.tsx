import { Button, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconFeather } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';

import { Parchment } from '@/components/Parchment/Parchment';
import { DESCRIPTION_MAX_LENGTH, DESCRIPTION_MIN_LENGTH } from '@/config/constants';
import { useCreateIdea } from '@/hooks/useCreateIdea';
import { ideaSchema, type IdeaFormValues } from './ideaSchema';
import classes from './SubmitIdeaForm.module.css';

const FORM_FIELDS = ['author', 'description'] as const;

/** The form paper is held by a nail at the top left and a dagger through the top right corner. */
const FORM_FASTENERS = [{ kind: 'nail-flush', x: 9 }, { kind: 'dagger-stuck' }] as const;

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
            notifications.show({ title: 'Quest not posted', message: unmapped.join(' '), color: 'red' });
          }
        },
      },
    );
  };

  const length = form.values.description.trim().length;

  return (
    <Parchment
      as="section"
      kind="sheet"
      seed={1}
      fasteners={FORM_FASTENERS}
      aria-labelledby="post-quest-title"
      className={classes.sheet}
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate aria-busy={isPending} className={classes.form}>
        <div className={classes.heading}>
          <IconFeather size={30} stroke={1.5} aria-hidden="true" className={classes.icon} />
          <div>
            <h2 id="post-quest-title" className={classes.title}>
              Post a quest
            </h2>
            <p className={classes.lede}>Describe the project you want built. The guild will do the judging.</p>
          </div>
        </div>
        <TextInput
          label="Your name"
          description="Optional. Leave it blank and you ride as an Anonymous adventurer."
          placeholder="Mira, keeper of merge conflicts"
          type="text"
          autoComplete="nickname"
          readOnly={isPending}
          {...form.getInputProps('author')}
        />
        <Textarea
          label="The quest"
          description={`What should the hero build? ${DESCRIPTION_MIN_LENGTH} to ${DESCRIPTION_MAX_LENGTH} characters.`}
          placeholder="A dragon-proof password vault. A kanban board for tavern staff. Whatever you can dream up."
          readOnly={isPending}
          autosize
          minRows={4}
          maxRows={10}
          {...form.getInputProps('description')}
        />
        <div className={classes.actions}>
          <span className={classes.count} aria-hidden="true">
            {length} / {DESCRIPTION_MAX_LENGTH}
          </span>
          <Button type="submit" loading={isPending}>
            Post the quest
          </Button>
        </div>
      </form>
    </Parchment>
  );
}

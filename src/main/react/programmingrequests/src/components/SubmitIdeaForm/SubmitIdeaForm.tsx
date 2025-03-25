import { zodResolver } from '@hookform/resolvers/zod';

import { SubmitHandler, useForm } from 'react-hook-form';

import CustomTextArea from './components/CustomForm/components/CustomTextArea';
import CustomTextInput from './components/CustomForm/components/CustomTextInput';
import { FormValues, schema } from './components/CustomForm/models/form.model';

import { Button, Group, Space, Title } from '@mantine/core';

import { useGlobalContext } from '@/context';
import { NewRequest } from '@/models';
import { newIdea } from '@/services';
import { useApi } from '@/hooks';

export function SubmitIdeaForm() {
  const { setValue } = useGlobalContext();

  const { fetch } = useApi<null, NewRequest>(newIdea);

  const onSubmit: SubmitHandler<FormValues> = async d => {
    await fetch(d);
    setValue(1);
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      author: '',
      description: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Title order={3}>Submit your idea</Title>
      <CustomTextInput
        name="author"
        placeholder="Author"
        control={control}
        label="Author"
        type="text"
        error={errors.author?.message}
        inputContainer={children => (
          <Group align="flex-start">
            {children}
            <Button type="submit">Submit</Button>
          </Group>
        )}
      />
      <Space h="xl" />
      <CustomTextArea
        name="description"
        placeholder="Write your idea here"
        control={control}
        label="Description"
        error={errors.description?.message}
        autosize
        minRows={3}
        maxRows={8}
      />
    </form>
  );
}

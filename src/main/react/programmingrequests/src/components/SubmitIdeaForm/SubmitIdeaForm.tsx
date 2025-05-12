import { zodResolver } from '@hookform/resolvers/zod';

import { SubmitHandler, useForm } from 'react-hook-form';

import CustomTextArea from './components/CustomForm/components/CustomTextArea';
import CustomTextInput from './components/CustomForm/components/CustomTextInput';
import { FormValues, schema } from './components/CustomForm/models/form.model';

import { Button, Group, Space, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { useGlobalContext } from '@/context';
import { useApi } from '@/hooks';
import { NewRequest, UseApiStatusResponse } from '@/models';
import { newIdea } from '@/services';

export function SubmitIdeaForm() {
  const { setIdeasFlag } = useGlobalContext();

  const { fetch, loading } = useApi<UseApiStatusResponse, NewRequest>(newIdea);

  const onSubmit: SubmitHandler<FormValues> = async d => {
    const { data } = await fetch(d);
    if (data?.status === 'OK') {
      reset();
      setIdeasFlag(1);
      notifications.show({
        title: 'Idea submitted!',
        message: 'Thank you for sharing your idea!',
        color: 'teal',
      });
    }
  };

  const {
    control,
    handleSubmit,
    reset,
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
      <Space h="xl" />
      <CustomTextInput
        name="author"
        placeholder="Author"
        control={control}
        label="Author"
        type="text"
        disabled={loading}
        error={errors.author?.message}
        inputContainer={children => (
          <Group align="flex-start">
            {children}
            <Button type="submit" loading={loading}>
              Submit
            </Button>
          </Group>
        )}
      />
      <Space h="xl" />
      <CustomTextArea
        name="description"
        placeholder="Write your idea here"
        control={control}
        label="Description"
        disabled={loading}
        error={errors.description?.message}
        autosize
        minRows={3}
        maxRows={8}
      />
    </form>
  );
}

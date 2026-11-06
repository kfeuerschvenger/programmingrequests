import classes from './HomePage.module.css';

import { lazy, Suspense } from 'react';

import { SubmitIdeaForm } from '@/components/SubmitIdeaForm/SubmitIdeaForm';
import { IdeaListSkeleton } from '@/components/ui';

const IdeasList = lazy(() => import('@/components/IdeasList/IdeasList'));

export function HomePage() {
  return (
    <div className={classes.page}>
      <section className={classes.hero}>
        <h1 className={classes.title}>Post a quest. Let the hero code.</h1>
        <div className={classes.rule} aria-hidden="true" />
        <p className={classes.intro}>
          Pin a programming idea to the board and let the guild vote. The most backed quests get built first: one hero,
          one keyboard, no mercy.
        </p>
      </section>
      <SubmitIdeaForm />
      <Suspense fallback={<IdeaListSkeleton />}>
        <IdeasList />
      </Suspense>
    </div>
  );
}

import { modals } from '@mantine/modals';
import { VOTING_RULES_TITLE, VotingRules } from './VotingRules';

export function showInfo() {
  modals.open({
    title: VOTING_RULES_TITLE,
    withCloseButton: false,
    size: 'lg',
    children: <VotingRules />,
  });
}

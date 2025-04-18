import { ReactNode, useState } from 'react';
import { GlobalContext } from './global.context';

const EmptyIdeasFlag: number = 0;

interface GlobalProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProps) => {
  const [ideasFlag, setIdeasFlag] = useState<number>(EmptyIdeasFlag);

  return <GlobalContext.Provider value={{ ideasFlag, setIdeasFlag }}>{children}</GlobalContext.Provider>;
};

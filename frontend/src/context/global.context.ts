import { createContext, useContext } from 'react';

interface GlobalContextType {
  ideasFlag: number | null;
  setIdeasFlag: React.Dispatch<React.SetStateAction<number>>;
}

export const GlobalContext = createContext<GlobalContextType>({
  ideasFlag: null,
  setIdeasFlag: () => {},
});

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);

  if (!context) {
    throw new Error('GlobalContext must be used within a GlobalContextProvider');
  }

  return context;
};

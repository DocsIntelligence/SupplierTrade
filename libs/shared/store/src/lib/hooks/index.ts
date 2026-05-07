import {
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector,
  type TypedUseSelectorHook,
} from 'react-redux';
import type { AppDispatch, RootState } from '../store.js';

export const useAppDispatch: () => AppDispatch = useReduxDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

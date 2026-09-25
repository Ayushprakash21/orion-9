import { useNavigate } from 'react-router-dom';

export function useOptionalNavigate() {
  try {
    return useNavigate();
  } catch (err) {
    return (_path: string | number, _options?: any) => {};
  }
}

import { redirect } from '@remix-run/node';

export const loader = async () => {
  return redirect('/admin');
};

export default function Index() {
  return null;
}

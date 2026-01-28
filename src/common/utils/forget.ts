export function forget<T>(p: Promise<T>) {
  p.catch((err) => console.error(err));
}

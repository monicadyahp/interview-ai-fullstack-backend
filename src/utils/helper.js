export const getPublicPhotoUrl = (folder = 'users') => {
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? 3005;
  return `http://${host}:${port}/images/${folder}/`;
};

// utils/generateObjectId.ts
export function generateObjectId() {
  // Generate a 24-character hex string (like Mongo IDs)
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = "xxxxxxxxxxxxxxxx".replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
  return (timestamp + random).substring(0, 24);
}

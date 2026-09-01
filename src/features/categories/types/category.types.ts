export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

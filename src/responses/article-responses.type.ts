export type ArticleResponseObject = {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: Date;
  updatedAt: Date;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
};

export type ArticleResponse = {
  article: ArticleResponseObject;
};

export type ArticlesResponse = {
  articles: ArticleResponseObject[];
  articlesCount: number;
};

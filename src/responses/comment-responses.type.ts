export type CommentResponseObject = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
};

export type CommentResponse = {
  comment: CommentResponseObject;
};

export type CommentsResponse = {
  comments: CommentResponseObject[];
};

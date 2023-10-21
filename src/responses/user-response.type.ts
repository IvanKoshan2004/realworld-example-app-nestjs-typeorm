export type UserResponseObject = {
  email: string;
  username: string;
  token: string;
  bio: string | null;
  image: string | null;
};

export type UserResponse = {
  user: UserResponseObject;
};
export type UserResponseNoToken = {
  user: Omit<UserResponseObject, 'token'>;
};

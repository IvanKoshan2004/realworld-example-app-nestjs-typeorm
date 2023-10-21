export type ProfileResponseObject = {
  username: string;
  bio: string;
  image: string;
  following: boolean;
};
export type ProfileResponse = {
  profile: ProfileResponseObject | null;
};

export type ProfilesResponse = {
  profiles: ProfileResponseObject[];
};

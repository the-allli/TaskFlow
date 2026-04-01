const generateAccessToken = (user) => {
  try {
    const accessToken = user.generateAccessToken();
    return { accessToken };
  } catch (error) {
    throw new Error("Something went wrong while generating access token");
  }
};

export default generateAccessToken;

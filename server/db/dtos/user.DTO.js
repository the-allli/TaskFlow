export default class UserDto {
  constructor(user) {
    this.id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.dp = user.dp || "";
    this.role = user.role;
    this.plan = user.plan;
    this.is_varified = user.is_varified;
  }
}

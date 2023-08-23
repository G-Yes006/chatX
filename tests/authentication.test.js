import { expect } from "chai";
import supertest from "supertest";
import app from "../app.js";
import chalk from "chalk";
import jwt from "jsonwebtoken";

const request = supertest(app);

describe(chalk.yellow("Authentication"), () => {
  let token;

  const checkErrorResponse = (res, statusCode, errorMessage) => {
    expect(res.status).to.equal(statusCode);
    expect(res.body).to.have.property("success").to.be.false;
    expect(res.body).to.have.property("message").to.equal(errorMessage);
  };

  it(
    chalk.cyan(
      "should return 401 when trying to access a protected route without authentication"
    ),
    async () => {
      const res = await request.get("/profile/getProfileDetails");
      checkErrorResponse(res, 401, "No token provided");
    }
  );

  it(
    chalk.cyan(
      "should return 401 when accessing a protected route with an invalid token"
    ),
    async () => {
      const invalidToken = "invalid_token_here";
      const res = await request
        .get("/profile/getProfileDetails")
        .set("Authorization", `Bearer ${invalidToken}`);
      checkErrorResponse(res, 401, "Invalid token");
    }
  );

  it(
    chalk.cyan(
      "should return 404 when accessing a protected route with a valid but non-existent user's token"
    ),
    async () => {
      const nonExistentUserId = "64ac50c007afc264dd3cbb51";
      const payload = { userId: nonExistentUserId };
      const invalidToken = jwt.sign(payload, process.env.JWT_SECRET);
      const res = await request
        .get("/profile/getProfileDetails")
        .set("Authorization", `Bearer ${invalidToken}`);
      checkErrorResponse(res, 404, "User not found");
    }
  );

  it(
    chalk.cyan(
      "should return 200 when accessing a protected route with valid authentication"
    ),
    async () => {
      const loginRes = await request
        .post("/users/login")
        .send({ email: "gorisab2@gmail.com", password: "asdfg1234" });
      expect(loginRes.status).to.equal(200);
      expect(loginRes.body).to.have.property("success").to.be.true;
      expect(loginRes.body).to.have.property("data");
      expect(loginRes.body.data).to.have.property("token");
      token = loginRes.body.data.token;
      const res = await request
        .get("/profile/getProfileDetails")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("success").to.be.true;
      expect(res.body).to.have.property("data");
      expect(res.body.data).to.have.property("_id");
      expect(res.body.data).to.have.property("name");
      expect(res.body.data).to.have.property("email");
      expect(res.body.data).to.have.property("profilePicture");
      expect(res.body.data).to.have.property("status");
      expect(res.body.data).to.have.property("bio");
    }
  );

  it(
    chalk.cyan(
      "should return 400 when registering without providing an email or password"
    ),
    async () => {
      const res = await request.post("/users/register").send({});
      checkErrorResponse(res, 400, "Email and password are required");
    }
  );

  it(
    chalk.cyan(
      "should return 400 when registering with an invalid email format"
    ),
    async () => {
      const res = await request
        .post("/users/register")
        .send({ email: "invalid_email", password: "strongPassword123" });
      checkErrorResponse(res, 400, "Invalid email format");
    }
  );

  it(
    chalk.cyan("should return 400 when registering with a weak password"),
    async () => {
      const res = await request
        .post("/users/register")
        .send({ email: "valid_email@example.com", password: "weak" });
      checkErrorResponse(
        res,
        400,
        "Password must be at least 8 characters long"
      );
    }
  );
});

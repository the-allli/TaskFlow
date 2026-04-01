# TaskFlow API Documentation

Complete API documentation for the TaskFlow project management SaaS application.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

API endpoints have rate limiting:

- **Auth endpoints**: 10 requests per 1 minutes
- **Payment endpoints**: 100 requests per 1 minutes
- **General endpoints**: 1000 requests per 1 minutes

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Workspace Endpoints](#workspace-endpoints)
3. [Project Endpoints](#project-endpoints)
4. [Task Endpoints](#task-endpoints)
5. [Payment Endpoints](#payment-endpoints)

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "userRole": "admin"
}
```

**Validation Rules:**

- `name`: Minimum 3 characters
- `email`: Valid email format
- `password`: Minimum 6 characters, must contain uppercase, lowercase, number, and special character
- `userRole`: Must be one of: `admin`, `manager`, `dev`

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    }
  }
}
```

---

### Verify Email

**POST** `/auth/verify-email`

Verify user's email address with OTP code.

**Request Body:**

```json
{
  "code": "123456"
}
```

**Validation Rules:**

- `code`: Exactly 6 digits, numeric only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### Login

**POST** `/auth/log-in`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules:**

- `email`: Valid email format
- `password`: Strong password format (same as registration)

**Success Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

---

### Logout

**POST** `/auth/log-out`

Logout current user (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get User Profile

**GET** `/auth/profile`

Get authenticated user's profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "profile_img": "https://cloudinary.com/..."
  }
}
```

---

### Check Authentication Status

**GET** `/auth/check-auth`

Verify if the current session is authenticated.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "auth": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Forgot Password

**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

### Reset Password

**POST** `/auth/reset-password/:token`

Reset password using reset token.

**URL Parameters:**

- `token`: 40-character hexadecimal reset token from email

**Request Body:**

```json
{
  "password": "NewSecurePass123!"
}
```

**Validation Rules:**

- `password`: Minimum 6 characters with uppercase, lowercase, number, and special character

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### Update Profile

**PUT** `/auth/update-profile`

Update user profile information (requires authentication).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**

```
profile_img: <file>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "profile_img": "https://cloudinary.com/..."
    }
  }
}
```

---

### Change Password

**PUT** `/auth/change-password`

Change password for authenticated user.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Workspace Endpoints

### Get All Workspaces

**GET** `/workspaces`

Get all workspaces for the authenticated user.

**Headers:**

```
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "workspace_id",
      "name": "My Workspace",
      "description": "Project workspace",
      "image": "https://cloudinary.com/...",
      "invite_code": "ABC123",
      "members": [...],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Create Workspace

**POST** `/workspaces/create`

Create a new workspace (requires admin role).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**

```
name: "My Workspace"
description: "Project workspace"
image: <file>
```

**Permissions:** Admin role required

**Success Response (201):**

```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "workspace": {
      "_id": "workspace_id",
      "name": "My Workspace",
      "description": "Project workspace",
      "invite_code": "ABC123"
    }
  }
}
```

---

### Join Workspace

**POST** `/workspaces/join/:invite_code`

Join a workspace using invite code.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `invite_code`: Workspace invitation code

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully joined workspace",
  "data": {
    "workspace": {
      "_id": "workspace_id",
      "name": "My Workspace"
    }
  }
}
```

---

### Get Workspace Members

**GET** `/workspaces/:workspaceId/members`

Get all members of a workspace.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID

**Permissions:** Admin, Manager, or Dev role

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "member_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "profile_img": "https://cloudinary.com/..."
    }
  ]
}
```

---

### Invite Member

**POST** `/workspaces/:workspaceId/invite`

Invite a member to workspace.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID

**Request Body:**

```json
{
  "email": "newmember@example.com",
  "role": "dev"
}
```

**Permissions:** Admin or Manager role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

---

### Update Member Role

**PATCH** `/workspaces/:workspaceId/members/:memberId/role`

Update a member's role in workspace.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `memberId`: Target member ID

**Request Body:**

```json
{
  "role": "manager"
}
```

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Member role updated successfully"
}
```

---

### Remove Member

**DELETE** `/workspaces/:workspaceId/members/:memberId`

Remove a member from workspace.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `memberId`: Target member ID

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### Update Workspace Settings

**PUT** `/workspaces/:workspaceId/settings`

Update workspace settings.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**URL Parameters:**

- `workspaceId`: Target workspace ID

**Request Body (FormData):**

```
name: "Updated Workspace Name"
description: "Updated description"
image: <file>
```

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Workspace settings updated successfully",
  "data": {
    "workspace": {
      "_id": "workspace_id",
      "name": "Updated Workspace Name",
      "description": "Updated description"
    }
  }
}
```

---

### Delete Workspace

**DELETE** `/workspaces/:workspaceId`

Delete a workspace.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

---

## Project Endpoints

### Create Project

**POST** `/workspaces/:workspaceId/projects`

Create a new project in workspace.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**URL Parameters:**

- `workspaceId`: Target workspace ID

**Request Body (FormData):**

```
name: "My Project"
description: "Project description"
files: <array of files> (max 10)
```

**Permissions:** Admin or Manager role

**Success Response (201):**

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "_id": "project_id",
      "name": "My Project",
      "description": "Project description",
      "files": ["https://cloudinary.com/..."]
    }
  }
}
```

---

### Update Project

**PUT** `/workspaces/:workspaceId/projects/:projectId`

Update project details.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID

**Request Body:**

```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

**Permissions:** Admin or Manager role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Project updated successfully"
}
```

---

### Delete Project

**DELETE** `/workspaces/:workspaceId/projects/:projectId`

Delete a project.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### Add Project Member

**POST** `/workspaces/:workspaceId/projects/:projectId/members`

Add a member to project.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID

**Request Body:**

```json
{
  "memberId": "member_id"
}
```

**Permissions:** Admin or Manager role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Member added to project successfully"
}
```

---

### Remove Project Member

**DELETE** `/workspaces/:workspaceId/projects/:projectId/members/:memberId`

Remove a member from project.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID
- `memberId`: Target member ID

**Permissions:** Admin or Manager role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Member removed from project successfully"
}
```

---

## Task Endpoints

### Create Task

**POST** `/workspaces/:workspaceId/projects/:projectId/tasks`

Create a new task in project.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID

**Request Body:**

```json
{
  "title": "Implement login feature",
  "description": "Create login page with validation",
  "status": "todo",
  "priority": "high",
  "assignees": ["member_id_1", "member_id_2"],
  "dueDate": "2024-12-31"
}
```

**Permissions:** Admin or Manager role

**Success Response (201):**

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "_id": "task_id",
      "title": "Implement login feature",
      "status": "todo",
      "priority": "high"
    }
  }
}
```

---

### Get Project Tasks

**GET** `/workspaces/:workspaceId/projects/:projectId/tasks`

Get all tasks for a project.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID

**Permissions:** Admin, Manager, or Dev role

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "task_id",
      "title": "Implement login feature",
      "description": "Create login page with validation",
      "status": "in-progress",
      "priority": "high",
      "assignees": [...],
      "comments": [...],
      "dueDate": "2024-12-31",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Update Task

**PATCH** `/workspaces/:workspaceId/projects/:projectId/tasks/:taskId`

Update task details.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID
- `taskId`: Target task ID

**Request Body:**

```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "priority": "medium"
}
```

**Permissions:** Admin or Manager role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task updated successfully"
}
```

---

### Update Task Status

**PATCH** `/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/status`

Update task status.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID
- `taskId`: Target task ID

**Request Body:**

```json
{
  "status": "completed"
}
```

**Permissions:** Admin, Manager, or Dev role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task status updated successfully"
}
```

---

### Update Task Assignees

**PATCH** `/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/assignees`

Update task assignees.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID
- `taskId`: Target task ID

**Request Body:**

```json
{
  "assignees": ["member_id_1", "member_id_2"]
}
```

**Permissions:** Admin or Manager role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task assignees updated successfully"
}
```

---

### Delete Tasks

**DELETE** `/workspaces/:workspaceId/projects/:projectId/tasks`

Delete multiple tasks.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `workspaceId`: Target workspace ID
- `projectId`: Target project ID

**Request Body:**

```json
{
  "taskIds": ["task_id_1", "task_id_2"]
}
```

**Permissions:** Admin or Manager role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tasks deleted successfully"
}
```

---

### Get Task Comments

**GET** `/tasks/:taskId/comments`

Get all comments for a task.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `taskId`: Target task ID

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "comment_id",
      "text": "Great progress on this task!",
      "author": {
        "_id": "user_id",
        "name": "John Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Add Comment

**POST** `/tasks/:taskId/comments`

Add a comment to a task.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `taskId`: Target task ID

**Request Body:**

```json
{
  "text": "This looks great!"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "_id": "comment_id",
      "text": "This looks great!",
      "author": {
        "_id": "user_id",
        "name": "John Doe"
      }
    }
  }
}
```

---

## Payment Endpoints

### Get Subscription Plans

**GET** `/payment/plans`

Get available subscription plans.

**Headers:**

```
Authorization: Bearer <token>
```

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "plan_free",
      "name": "Free",
      "price": 0,
      "features": ["Basic features"]
    },
    {
      "id": "plan_pro",
      "name": "Pro",
      "price": 29.99,
      "features": ["Advanced features"]
    }
  ]
}
```

---

### Get User Subscription

**GET** `/payment/:userId/subscription`

Get subscription details for a user.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `userId`: Target user ID

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": "pro",
      "status": "active",
      "current_period_start": "2024-01-01",
      "current_period_end": "2024-02-01"
    }
  }
}
```

---

### Get Payment History

**GET** `/payment/:userId/history`

Get payment history for a user.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `userId`: Target user ID

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "payment_id",
      "amount": 29.99,
      "currency": "usd",
      "status": "succeeded",
      "date": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Create Checkout Session

**POST** `/payment/checkout`

Create Stripe checkout session for subscription.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "planId": "plan_pro",
  "successUrl": "https://yourdomain.com/success",
  "cancelUrl": "https://yourdomain.com/cancel"
}
```

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "sessionId": "cs_abc123",
  "url": "https://checkout.stripe.com/c/pay/cs_abc123"
}
```

---

### Cancel Subscription

**DELETE** `/payment/:userId/subscription`

Cancel user's subscription.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `userId`: Target user ID

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

---

### Downgrade to Free Plan

**DELETE** `/payment/:userId/downgrade`

Downgrade user subscription to free plan at end of billing period.

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `userId`: Target user ID

**Permissions:** Admin role only

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subscription will be downgraded to free plan at end of billing period"
}
```

---

### Stripe Webhook

**POST** `/payment/webhook`

Handle Stripe webhook events (no authentication required).

**Headers:**

```
Stripe-Signature: <stripe-signature>
```

**Request Body:**

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_abc123",
      "customer": "cus_abc123"
    }
  }
}
```

**Success Response (200):**

```json
{
  "received": true
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

### Validation Error (400)

```json
{
  "success": false,
  "message": "Specific error message",
  "errors": ["Error detail 1", "Error detail 2"]
}
```

### Authentication Error (401)

```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

### Authorization Error (403)

```json
{
  "success": false,
  "message": "Forbidden - Insufficient permissions"
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limit Exceeded (429)

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- File uploads use Cloudinary for storage
- All monetary amounts are in USD
- The API uses MongoDB for data persistence
- JWT tokens expire after 1 day by default

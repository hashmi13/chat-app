# Group Messaging Feature

This document describes the group messaging functionality that has been added to your chat application.

## Features Added

### Backend Features

1. **Group Model** (`server-side/model/group.js`)
   - Group name, description, and profile picture
   - Creator, admins, and members management
   - Active/inactive status

2. **Group Message Model** (`server-side/model/groupMessage.js`)
   - Messages sent to groups
   - Seen status tracking for each member
   - Support for text and image messages

3. **Group Controllers** (`server-side/controllers/groupCont.js`)
   - Create new groups
   - Get user's groups
   - Get group details and messages
   - Send messages to groups
   - Add/remove members
   - Leave groups
   - Mark messages as seen

4. **Group Routes** (`server-side/routes/groupRoutes.js`)
   - All group-related API endpoints
   - Protected with authentication middleware

### Frontend Features

1. **Group Context** (`client-side/context/GroupContext.jsx`)
   - State management for groups
   - Real-time group messaging
   - Group operations (create, join, leave)

2. **Group Chat Container** (`client-side/src/component/GroupChatContainer.jsx`)
   - Group chat interface
   - Message display with sender information
   - Image sharing support
   - Leave group functionality

3. **Create Group Modal** (`client-side/src/component/CreateGroupModal.jsx`)
   - User-friendly group creation interface
   - Member selection with search
   - Group name and description input

4. **Updated Sidebar** (`client-side/src/component/sidbar.jsx`)
   - Tabs for Users and Groups
   - Group list with member count
   - Create group button
   - Unread message indicators

## How to Use

### Creating a Group

1. Click on the "Groups" tab in the sidebar
2. Click the "Create Group" button
3. Enter a group name and optional description
4. Select members from the user list
5. Click "Create Group"

### Group Chat

1. Select a group from the Groups tab
2. Send text messages or images
3. See who sent each message
4. Leave the group using the "Leave" button

### Group Management

- **Admins** can add/remove members
- **Creator** can transfer ownership or delete the group
- **Members** can leave the group
- All members can see group details and member list

## API Endpoints

### Groups
- `POST /api/group/create` - Create a new group
- `GET /api/group/user-groups` - Get user's groups
- `GET /api/group/:groupId` - Get group details
- `POST /api/group/:groupId/add-members` - Add members to group
- `DELETE /api/group/:groupId/members/:memberId` - Remove member from group
- `DELETE /api/group/:groupId/leave` - Leave group

### Group Messages
- `GET /api/group/:groupId/messages` - Get group messages
- `POST /api/group/:groupId/send` - Send message to group
- `PUT /api/group/:groupId/messages/:messageId/seen` - Mark message as seen

## Real-time Features

- New group messages appear instantly for all group members
- Unread message counts update in real-time
- Online/offline status for group members

## Security Features

- Authentication required for all group operations
- Users can only access groups they're members of
- Admins can only manage groups they have permission for
- Input validation and error handling

## Database Schema

### Group Collection
```javascript
{
  name: String (required),
  description: String,
  groupPic: String,
  createdBy: ObjectId (ref: User),
  admins: [ObjectId] (ref: User),
  members: [ObjectId] (ref: User),
  isActive: Boolean,
  timestamps
}
```

### GroupMessage Collection
```javascript
{
  groupId: ObjectId (ref: Group),
  senderId: ObjectId (ref: User),
  text: String,
  image: String,
  seenBy: [{
    userId: ObjectId (ref: User),
    seenAt: Date
  }],
  timestamps
}
```

## Future Enhancements

- Group profile picture upload
- Group message reactions
- Group message replies
- Group message search
- Group message deletion
- Group invitation links
- Group message notifications
- Group message encryption 
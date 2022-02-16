const TINDER_BASE_PATH = 'http://localhost:8080/api';

function TinderApi() {

  this.getUsers = async () => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };

  this.getReceivedMessagesFromUser = async (userId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/messages?type=received`);
      const data = await response.json();
      const filterData = await data.filter(message => message.receiverId === userId);
      return filterData;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };

  this.getSentMessagesFromUser = async (userId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/messages?type=sent`);
      const data = await response.json();
      const filterData = await data.filter(message => message.senderId === userId);
      return filterData;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };

  this.getConversationBetweenUsers = async (userId, friendId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/messages?type=conversation&friendId=${friendId}`);
      const data = await response.json();
      const filterData = await data.filter(message => ((message.senderId === friendId) && (message.receiverId === userId)) || ((message.receiverId === friendId) && (message.senderId === userId)));
      return filterData;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };

  this.addMessageBetweenUsers = async (message) => {
    console.log(message);
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/messages`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      console.log(response);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };

  this.getMatches = async () => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/matches`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };
  
  this.getMatchesForUser = async (userId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/matches`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };

  this.createMatch = async (match) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/matches`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(match),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('An error has occured!', error);
    }
  };
}
(() => {

  const app = {

    init() {
      this.tinderApi = new TinderApi();
      this.cacheElements();
      this.fetchUsers();
    },
    cacheElements() {
      this.$userListContainer = document.querySelector(".user__container");
      this.$inboxContainer = document.querySelector(".inbox__message");
      this.$outboxContainer = document.querySelector(".outbox__message");
      this.$inboxAmount = document.querySelector(".inbox__amount");
      this.$outboxAmount = document.querySelector(".outbox__amount");
      this.$messageContainer = document.querySelector(".messages");
      this.$conversationContainer = document.querySelector(".conversation__container");
      this.$conversationHeader = document.querySelector(".conversation__header");
      this.$matchesContainer = document.querySelector(".matches");
      this.$noMatchesContainer = document.querySelector(".no-matches");
      this.$conversationSection = document.querySelector(".conversation");
      this.$matchesRestContainer = document.querySelector(".matches-rest");
    },
    async fetchUsers() {
      this.users = await this.tinderApi.getUsers();
      this.$userListContainer.innerHTML = this.users.map(user => this.generateHTMLForUsers(user)).join('');
      this.addEventListenerToUserList();

      // Set first user active
      this.currentUser = this.users[0];
      this.highlightActiveUser(this.currentUser.id);
      this.fetchMessages(this.currentUser.id);
      this.fetchMatches(this.currentUser.id);
    },
    highlightActiveMessage(receiverId, senderId) {
      const $messages = document.querySelectorAll(".message");
      for (const message of $messages) {
        if (receiverId === this.userId) {
          message.dataset.sender === senderId ? message.classList.add("active") : message.classList.remove("active");
        } else {
          message.dataset.receiver === receiverId ? message.classList.add("active") : message.classList.remove("active");
        }
      }
    },
    generateHTMLForUsers(user) {
      return `
      <li><a href="#" data-id=${user.id} class="user btn-hover btn-color gradient">
        <img class="user__img" src="${user.picture.thumbnail}" alt="">
        <span class="user__name">${user.firstName} ${user.lastName}</span>
      </a></li>`;
    },
    addEventListenerToUserList() {
      this.$userListContainer.addEventListener('click', ev => {
        const userId = ev.target.dataset.id;
        this.fetchMessages(userId);
        this.fetchMatches(userId);
        this.highlightActiveUser(userId);
      }), false;
    },
    highlightActiveUser(userId) {
      const $users = document.querySelectorAll(".user");
      this.userId = userId;

      for (const user of $users) {
        user.dataset.id === userId ? user.classList.add("active") : user.classList.remove("active");
      }
    },
    async fetchMessages(userId) {
      this.receivedMessages = await this.tinderApi.getReceivedMessagesFromUser(userId);
      this.$inboxContainer.innerHTML = this.receivedMessages.map(message => this.generateHTMLForMessages(message)).join("");
      this.$inboxAmount.innerHTML = this.receivedMessages.length;

      this.sendMessages = await this.tinderApi.getSentMessagesFromUser(userId);
      this.$outboxContainer.innerHTML = this.sendMessages.map(message => this.generateHTMLForMessages(message)).join("");
      this.$outboxAmount.innerHTML = this.sendMessages.length;

      this.addEventListenerToMessageList(userId);

      // Set first message active
      this.currentConversation = await this.tinderApi.getConversationBetweenUsers(this.receivedMessages[0].receiverId, this.receivedMessages[0].senderId);
      this.$conversationSection.innerHTML = this.generateConversation(this.currentConversation, this.receivedMessages[0].senderId, this.receivedMessages[0].receiverId);
      this.receivedMessages[0].senderId === userId ? this.generateConversationBetweenUsers(this.receivedMessages[0].senderId, this.receivedMessages[0].receiverId) : this.generateConversationBetweenUsers(this.receivedMessages[0].receiverId, this.receivedMessages[0].senderId);
    },
    generateHTMLForMessages(message) {
      return `
      <li><a href="#" data-sender=${message.senderId} data-receiver=${message.receiverId} class="message scrollbar-hidden btn-white">
        <div class="message__header">
            <span class="message__name">${message.senderId === this.userId ? this.findName(message.receiverId) : this.findName(message.senderId)}</span>
            <span class="message__date">${moment(message.createdAt).format('lll')}</span>
        </div>
        <span class="message__body">${message.message}</span>
      </a></li>`
    },
    addEventListenerToMessageList(userId) {
      this.$messageContainer.addEventListener('click', async ev => {
        const senderId = ev.target.dataset.sender;
        const receiverId = ev.target.dataset.receiver;
        this.conversation = await this.tinderApi.getConversationBetweenUsers(receiverId, senderId);
        this.$conversationSection.innerHTML = this.generateConversation(this.conversation, senderId, receiverId);
        senderId === userId ? this.generateConversationBetweenUsers(senderId, receiverId, userId) : this.generateConversationBetweenUsers(receiverId, senderId, userId);
      }), false;
    },
    generateConversation(conversation, senderId, receiverId) {
      return `
      <div class="conversation__header btn-white">
        <img class="conversation__header-profile" src="${this.userId === senderId ? this.findProfilePicture(receiverId) : this.findProfilePicture(senderId)}">
        <h2 class="block-title"><span>You are chatting with</span> ${this.userId === senderId ? this.findName(receiverId) : this.findName(senderId)}</h2>
        </div>
      <div class="conversation__container scrollbar-hidden">
      ${this.userId === senderId ? conversation.map(message => this.generateHTMLForConversation(message, receiverId)).join("") : conversation.map(message => this.generateHTMLForConversation(message, senderId)).join("")}
      </div>
      <form id="conversation" class="conversation__type-container">
          <input type="text" class="conversation__input btn-white" name="conversation__input" placeholder="Type your message..."></input>
          <button type="button" class="conversation__button btn-color gradient--btn"><img class="send_btn-img" src="../static/img/send.png" alt="">
          </button>
      </form>`
    },
    generateHTMLForConversation(message, userId) {
      if (message.senderId === userId) {
        return `<p class="conversation__message receiver btn-white"><date>${moment(message.createdAt).format('lll')}</date><br><span >${this.findName(userId)}</span>: ${message.message}</p>`
      } else {
        return `<p class="conversation__message sender btn-chat"><date>${moment(message.createdAt).format('lll')}</date><br>${this.findName(message.senderId)}: ${message.message}</p>`
      };
    },
    generateConversationBetweenUsers(senderId, receiverId, userId) {
      const $conversationBtn = document.querySelector(".conversation__button");
      const $conversationInput = document.querySelector(".conversation__input");

      $conversationBtn.addEventListener('click', async ev => {
        ev.preventDefault()

        const messageToCreate = {
          senderId: senderId,
          receiverId: receiverId,
          message: $conversationInput.value,
        }

        await this.tinderApi.addMessageBetweenUsers(messageToCreate);
        await this.fetchMessages(senderId)

        this.conversation = await this.tinderApi.getConversationBetweenUsers(receiverId, senderId);
        this.$conversationSection.innerHTML = this.generateConversation(this.conversation, senderId, receiverId);
        await senderId === this.userId ? this.generateConversationBetweenUsers(senderId, receiverId) : this.generateConversationBetweenUsers(receiverId, senderId);
      })
    },
    async fetchMatches(userId) {
      this.matches = await this.tinderApi.getMatchesForUser(userId);
      this.generateMatches(this.matches);
    },
    generateMatches(matches) {
      this.myLikes = matches.filter(match => match.userId === this.userId);
      this.otherLikes = matches.filter(match => match.friendId === this.userId);
      this.$matchesContainer.innerHTML = this.otherLikes.map(match => this.generateHTMLForMatch(match)).join('');

      const otherLikes = this.otherLikes.map(otherLike => otherLike.userId);
      const myLikes = this.myLikes.map(myLike => myLike.friendId);
      this.restMatches = myLikes.filter(myLike => !otherLikes.includes(myLike))
      this.findMatches = this.restMatches.map(match => this.findMatch(match));
      this.$matchesRestContainer.innerHTML = this.findMatches.map(match => this.generateHTMLForRestMatches(match)).join('');

      this.generateNoMatches(this.myLikes, this.otherLikes, this.userId);
      this.addEventListenerToMatches();
    },
    generateHTMLForMatch(otherLike) {
      const friend = this.findUser(otherLike.userId);
      return `
      <div class="match__user-container">
      <div class="match__user">
          <img class="user__img" src="${friend.picture.thumbnail}" alt="">
          <div class="match__user-details">
              <span class="user__name">${friend.firstName} ${friend.lastName}</span>
              <span class="user__rating gradient--btn--s">${otherLike.rating}s you</span>
              <div>
                <span class="user__age user__details">${this.getAge(friend.dayOfBirth)}</span> /
                <span class="user__city user__details">${friend.location.city}</span> /
                <span class="user__country user__details">${friend.location.country}</span>
              </div>
          </div>
      </div>
      ${this.ReturnRatingToFriend(otherLike)}`
    },
    ReturnRatingToFriend(otherLike) {
      let hasMatch = this.myLikes.some(myLike => myLike.friendId === otherLike.userId);

      if (hasMatch) {
        this.result = this.myLikes.find(myLike => myLike.friendId === otherLike.userId);
        return `
        <div class="match__footer">
          <button data-friend=${otherLike.userId} data-user=${otherLike.friendId} data-rating="dislike" class="close btn ${this.result.rating}"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><rect x="239.37" y="491.91" width="561.26" height="40.17" transform="translate(-209.73 517.66) rotate(-45)"/><rect x="499.91" y="231.37" width="40.17" height="561.26" transform="translate(-209.73 517.66) rotate(-45)"/><path d="M520,974A462.12,462.12,0,0,1,340.16,86.31,462.12,462.12,0,0,1,699.84,937.69,459.25,459.25,0,0,1,520,974Zm0-888.7C284.72,85.3,93.3,276.72,93.3,512S284.72,938.7,520,938.7,946.7,747.28,946.7,512,755.28,85.3,520,85.3Z"/></svg></button>
          <button data-friend=${otherLike.userId} data-user=${otherLike.friendId} data-rating="like" class="heart btn ${this.result.rating}"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M1002.77,378.64c-2.34,15.16-4.41,30.37-7,45.47-9.51,54.41-29.67,104.95-56.64,152.87-47.79,84.88-112.47,155.54-185.49,219.07C685.79,855,612.38,906,534,949.85c-9.87,5.52-18.24,5.54-28.11,0C402.68,892.14,308.2,822.83,225,738.73,162.38,675.51,109.23,605.44,74.1,523,47.64,460.9,32.8,396.43,38.41,328.51c5.65-68.35,33.75-126.91,80.83-176.26,34.29-35.92,75.24-61.38,123.65-74.08,53.86-14.13,106.48-9.59,157.83,11,47.17,18.94,86.12,48.75,116.24,89.88a37.25,37.25,0,0,0,2.58,2.81c9.69-11,18.58-22.37,28.72-32.45C600.11,97.84,662.84,70.6,735.92,70.14c64.34-.41,120.29,23.69,168,66.09,50.18,44.63,81.83,100.34,94.26,166.59,1.9,10.11,3.1,20.36,4.62,30.54Zm-32.08-34.56C969.11,268.91,934.26,197.86,864,145.17c-38-28.5-81.4-44.06-129.09-42.76C649.09,104.75,583,143.18,537.09,215.85c-10.91,17.27-23.8,17.38-34.44-.16-14.49-23.88-32.24-45-54.33-62.09-57.39-44.43-122-62.41-193-45.34C156.11,132.09,79,225.55,70.56,327.51,65.84,385,76.31,440.11,96.72,493.57c27.05,70.82,69.08,132.35,119.54,188.23,86.09,95.32,187.13,172,298.27,235.66,2.77,1.59,8,1.52,10.84-.07a1261.88,1261.88,0,0,0,215.9-154.12C805,706.63,862.35,644.42,905.81,570.46,944.63,504.4,969,433.92,970.69,344.08Z"/></svg></button>
          <button data-friend=${otherLike.userId} data-user=${otherLike.friendId} data-rating="superlike" class="star btn ${this.result.rating}"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M210.41,996.37l57.38-350.1L11.93,400.53l350.69-53.61L517.27,27.63l159.36,317L1028.07,393,775.87,642.52l62.55,349.2L523.19,829ZM81.71,422.63,302.52,634.7,253,936.83,522.92,792.36,795,932.82,741,631.46,958.62,416.15,655.33,374.37,517.81,100.84,384.35,376.37Z"/></svg></button>
        </div>
        </div>`
      } else {
        return `
        <div class="match__footer">
          <button data-friend=${otherLike.userId} data-user=${otherLike.friendId} data-rating="dislike" class="close btn "><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><rect x="239.37" y="491.91" width="561.26" height="40.17" transform="translate(-209.73 517.66) rotate(-45)"/><rect x="499.91" y="231.37" width="40.17" height="561.26" transform="translate(-209.73 517.66) rotate(-45)"/><path d="M520,974A462.12,462.12,0,0,1,340.16,86.31,462.12,462.12,0,0,1,699.84,937.69,459.25,459.25,0,0,1,520,974Zm0-888.7C284.72,85.3,93.3,276.72,93.3,512S284.72,938.7,520,938.7,946.7,747.28,946.7,512,755.28,85.3,520,85.3Z"/></svg></button>
          <button data-friend=${otherLike.userId} data-user=${otherLike.friendId} data-rating="like" class="heart btn"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M1002.77,378.64c-2.34,15.16-4.41,30.37-7,45.47-9.51,54.41-29.67,104.95-56.64,152.87-47.79,84.88-112.47,155.54-185.49,219.07C685.79,855,612.38,906,534,949.85c-9.87,5.52-18.24,5.54-28.11,0C402.68,892.14,308.2,822.83,225,738.73,162.38,675.51,109.23,605.44,74.1,523,47.64,460.9,32.8,396.43,38.41,328.51c5.65-68.35,33.75-126.91,80.83-176.26,34.29-35.92,75.24-61.38,123.65-74.08,53.86-14.13,106.48-9.59,157.83,11,47.17,18.94,86.12,48.75,116.24,89.88a37.25,37.25,0,0,0,2.58,2.81c9.69-11,18.58-22.37,28.72-32.45C600.11,97.84,662.84,70.6,735.92,70.14c64.34-.41,120.29,23.69,168,66.09,50.18,44.63,81.83,100.34,94.26,166.59,1.9,10.11,3.1,20.36,4.62,30.54Zm-32.08-34.56C969.11,268.91,934.26,197.86,864,145.17c-38-28.5-81.4-44.06-129.09-42.76C649.09,104.75,583,143.18,537.09,215.85c-10.91,17.27-23.8,17.38-34.44-.16-14.49-23.88-32.24-45-54.33-62.09-57.39-44.43-122-62.41-193-45.34C156.11,132.09,79,225.55,70.56,327.51,65.84,385,76.31,440.11,96.72,493.57c27.05,70.82,69.08,132.35,119.54,188.23,86.09,95.32,187.13,172,298.27,235.66,2.77,1.59,8,1.52,10.84-.07a1261.88,1261.88,0,0,0,215.9-154.12C805,706.63,862.35,644.42,905.81,570.46,944.63,504.4,969,433.92,970.69,344.08Z"/></svg></button>
          <button data-friend=${otherLike.userId} data-user=${otherLike.friendId} data-rating="superlike" class="star btn"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M210.41,996.37l57.38-350.1L11.93,400.53l350.69-53.61L517.27,27.63l159.36,317L1028.07,393,775.87,642.52l62.55,349.2L523.19,829ZM81.71,422.63,302.52,634.7,253,936.83,522.92,792.36,795,932.82,741,631.46,958.62,416.15,655.33,374.37,517.81,100.84,384.35,376.37Z"/></svg></button>
        </div>
        </div>`;
      }
    },
    generateHTMLForRestMatches(match) {
      const friend = this.findUser(match.friendId);
      return `
      <div class="match__user-container">
      <div class="match__user">
          <img class="user__img" src="${friend.picture.thumbnail}" alt="">
          <div class="match__user-details">
              <span class="user__name">${friend.firstName} ${friend.lastName}</span>
              <div>
                <span class="user__age user__details">${this.getAge(friend.dayOfBirth)}</span> /
                <span class="user__city user__details">${friend.location.city}</span> /
                <span class="user__country user__details">${friend.location.country}</span>
              </div>
          </div>
      </div>
      <div class="match__footer">
      <button data-friend=${match.userId} data-user=${match.friendId} data-rating=${match.rating} class="close btn ${match.rating}"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><rect x="239.37" y="491.91" width="561.26" height="40.17" transform="translate(-209.73 517.66) rotate(-45)"/><rect x="499.91" y="231.37" width="40.17" height="561.26" transform="translate(-209.73 517.66) rotate(-45)"/><path d="M520,974A462.12,462.12,0,0,1,340.16,86.31,462.12,462.12,0,0,1,699.84,937.69,459.25,459.25,0,0,1,520,974Zm0-888.7C284.72,85.3,93.3,276.72,93.3,512S284.72,938.7,520,938.7,946.7,747.28,946.7,512,755.28,85.3,520,85.3Z"/></svg></button>
      <button data-friend=${match.userId} data-user=${match.friendId} data-rating=${match.rating} class="heart btn ${match.rating}"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M1002.77,378.64c-2.34,15.16-4.41,30.37-7,45.47-9.51,54.41-29.67,104.95-56.64,152.87-47.79,84.88-112.47,155.54-185.49,219.07C685.79,855,612.38,906,534,949.85c-9.87,5.52-18.24,5.54-28.11,0C402.68,892.14,308.2,822.83,225,738.73,162.38,675.51,109.23,605.44,74.1,523,47.64,460.9,32.8,396.43,38.41,328.51c5.65-68.35,33.75-126.91,80.83-176.26,34.29-35.92,75.24-61.38,123.65-74.08,53.86-14.13,106.48-9.59,157.83,11,47.17,18.94,86.12,48.75,116.24,89.88a37.25,37.25,0,0,0,2.58,2.81c9.69-11,18.58-22.37,28.72-32.45C600.11,97.84,662.84,70.6,735.92,70.14c64.34-.41,120.29,23.69,168,66.09,50.18,44.63,81.83,100.34,94.26,166.59,1.9,10.11,3.1,20.36,4.62,30.54Zm-32.08-34.56C969.11,268.91,934.26,197.86,864,145.17c-38-28.5-81.4-44.06-129.09-42.76C649.09,104.75,583,143.18,537.09,215.85c-10.91,17.27-23.8,17.38-34.44-.16-14.49-23.88-32.24-45-54.33-62.09-57.39-44.43-122-62.41-193-45.34C156.11,132.09,79,225.55,70.56,327.51,65.84,385,76.31,440.11,96.72,493.57c27.05,70.82,69.08,132.35,119.54,188.23,86.09,95.32,187.13,172,298.27,235.66,2.77,1.59,8,1.52,10.84-.07a1261.88,1261.88,0,0,0,215.9-154.12C805,706.63,862.35,644.42,905.81,570.46,944.63,504.4,969,433.92,970.69,344.08Z"/></svg></button>
      <button data-friend=${match.userId} data-user=${match.friendId} data-rating=${match.rating} class="star btn ${match.rating}"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M210.41,996.37l57.38-350.1L11.93,400.53l350.69-53.61L517.27,27.63l159.36,317L1028.07,393,775.87,642.52l62.55,349.2L523.19,829ZM81.71,422.63,302.52,634.7,253,936.83,522.92,792.36,795,932.82,741,631.46,958.62,416.15,655.33,374.37,517.81,100.84,384.35,376.37Z"/></svg></button>
    </div>
    </div>`
    },
    async generateNoMatches(myLikes, otherLikes, userId) {
      const myLikeFriendId = myLikes.map(myLike => myLike.friendId);
      const myLikeUserId = otherLikes.map(myLike => myLike.userId);
      const myLikeId = [...new Set([...myLikeFriendId, ...myLikeUserId])];
      const filterNoMatchUsers = this.users.filter(user => myLikeId.includes(user.id) === false);
      filterNoMatchUsers.shift();
      this.$noMatchesContainer.innerHTML = filterNoMatchUsers.map(user => this.generateHTMLForNoMatches(user, userId)).join("");
    },
    generateHTMLForNoMatches(friend, user) {
      return `      
      <div class="match__user-container">
      <div class="match__user">
          <img class="user__img" src="${friend.picture.thumbnail}" alt="">
          <div class="match__user-details">
              <span class="user__name">${friend.firstName} ${friend.lastName}</span>
              <div>
                <span class="user__age user__details">${this.getAge(friend.dayOfBirth)}</span> /
                <span class="user__city user__details">${friend.location.city}</span> /
                <span class="user__country user__details">${friend.location.country}</span>
              </div>
          </div>
      </div>
      <div class="match__footer">
      <button data-friend=${friend.id} data-user=${user} data-rating="dislike" class="close btn "><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><rect x="239.37" y="491.91" width="561.26" height="40.17" transform="translate(-209.73 517.66) rotate(-45)"/><rect x="499.91" y="231.37" width="40.17" height="561.26" transform="translate(-209.73 517.66) rotate(-45)"/><path d="M520,974A462.12,462.12,0,0,1,340.16,86.31,462.12,462.12,0,0,1,699.84,937.69,459.25,459.25,0,0,1,520,974Zm0-888.7C284.72,85.3,93.3,276.72,93.3,512S284.72,938.7,520,938.7,946.7,747.28,946.7,512,755.28,85.3,520,85.3Z"/></svg></button>
      <button data-friend=${friend.id} data-user=${user} data-rating="like" class="heart btn"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M1002.77,378.64c-2.34,15.16-4.41,30.37-7,45.47-9.51,54.41-29.67,104.95-56.64,152.87-47.79,84.88-112.47,155.54-185.49,219.07C685.79,855,612.38,906,534,949.85c-9.87,5.52-18.24,5.54-28.11,0C402.68,892.14,308.2,822.83,225,738.73,162.38,675.51,109.23,605.44,74.1,523,47.64,460.9,32.8,396.43,38.41,328.51c5.65-68.35,33.75-126.91,80.83-176.26,34.29-35.92,75.24-61.38,123.65-74.08,53.86-14.13,106.48-9.59,157.83,11,47.17,18.94,86.12,48.75,116.24,89.88a37.25,37.25,0,0,0,2.58,2.81c9.69-11,18.58-22.37,28.72-32.45C600.11,97.84,662.84,70.6,735.92,70.14c64.34-.41,120.29,23.69,168,66.09,50.18,44.63,81.83,100.34,94.26,166.59,1.9,10.11,3.1,20.36,4.62,30.54Zm-32.08-34.56C969.11,268.91,934.26,197.86,864,145.17c-38-28.5-81.4-44.06-129.09-42.76C649.09,104.75,583,143.18,537.09,215.85c-10.91,17.27-23.8,17.38-34.44-.16-14.49-23.88-32.24-45-54.33-62.09-57.39-44.43-122-62.41-193-45.34C156.11,132.09,79,225.55,70.56,327.51,65.84,385,76.31,440.11,96.72,493.57c27.05,70.82,69.08,132.35,119.54,188.23,86.09,95.32,187.13,172,298.27,235.66,2.77,1.59,8,1.52,10.84-.07a1261.88,1261.88,0,0,0,215.9-154.12C805,706.63,862.35,644.42,905.81,570.46,944.63,504.4,969,433.92,970.69,344.08Z"/></svg></button>
      <button data-friend=${friend.id} data-user=${user} data-rating="superlike" class="star btn"><svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 1024"><path d="M210.41,996.37l57.38-350.1L11.93,400.53l350.69-53.61L517.27,27.63l159.36,317L1028.07,393,775.87,642.52l62.55,349.2L523.19,829ZM81.71,422.63,302.52,634.7,253,936.83,522.92,792.36,795,932.82,741,631.46,958.62,416.15,655.33,374.37,517.81,100.84,384.35,376.37Z"/></svg></button>
    </div>
    </div>`
    },
    addEventListenerToMatches() {
      this.$matchBtn = document.querySelectorAll(".match__user-container");

      for (const matchBtn of this.$matchBtn) {
        matchBtn.addEventListener('click', async ev => {
          ev.preventDefault()

          const user = ev.target.dataset.user;
          const friend = ev.target.dataset.friend;
          const rating = ev.target.dataset.rating;

          const match = {
            userId: user,
            friendId: friend,
            rating: rating,
          }
          
          await this.tinderApi.createMatch(match);
          await this.fetchMatches(user);
        });
      }
    },
    findMatch(userId) {
      return this.matches.find(rating => rating.friendId === userId);
    },
    findUser(userId) {
      return this.users.find(user => user.id === userId);
    },
    findName(userId) {
      const user = this.users.find(user => user.id === userId);
      return `${user.firstName} ${user.lastName}`
    },
    findAge(userId) {
      const user = this.users.find(user => user.id === userId);
      return `${user.dayOfBirth}`
    },
    findProfilePicture(userId) {
      const user = this.users.find(user => user.id === userId);
      return user.picture.thumbnail;
    },
    getAge(birthday) {
      const birth = new Date(birthday);
      const month_diff = Date.now() - birth.getTime();
      const age_dt = new Date(month_diff);
      const year = age_dt.getUTCFullYear();
      const age = Math.abs(year - 1970);
      return `${age}y`;
    }
  }

  app.init();

})();
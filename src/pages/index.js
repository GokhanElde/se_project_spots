import "../pages/index.css";
import {
  enableValidation,
  settings,
  resetValidation,
} from "../scripts/validation.js";

import Api from "../utils/Api.js";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "cd1ee879-5713-4c7a-87f3-53a635a1979a",
    "Content-Type": "application/json",
  },
});

let selectedCard = null;
let selectedCardId = null;

Promise.all([api.getUserInfo(), api.getInitialCards()])
  .then(([user, cards]) => {
    profileNameEl.textContent = user.name;
    profileDescriptionEl.textContent = user.about;
    profileAvatarEl.src = user.avatar;
    profileAvatarEl.alt = `${user.name}'s avatar`;
    cards.forEach((item) => renderCard(item, "append"));
  })
  .catch(console.error);

const editProfileBtn = document.querySelector(".profile__edit-btn");
const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileForm = document.querySelector("#edit-profile-form");
const editProfileNameInput = editProfileModal.querySelector(
  "#profile-name-input"
);
const editProfileDescriptionInput = editProfileModal.querySelector(
  "#profile-description-input"
);

const newPostBtn = document.querySelector(".profile__new-post-btn");
const newPostModal = document.querySelector("#new-post-modal");
const newPostForm = document.querySelector("#new-post-form");
const newPostCaptionInput = newPostModal.querySelector("#card-caption-input");
const newPostImageInput = newPostModal.querySelector("#card-image-input");

const avatarModalBtn = document.querySelector(".profile__avatar-btn");
const avatarModal = document.querySelector("#edit-avatar-modal");
const avatarForm = document.querySelector("#edit-avatar-form");
const avatarInput = avatarModal.querySelector("#profile-avatar-input");
const avatarError = avatarModal.querySelector("#profile-avatar-input-error");

const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");
const profileAvatarEl = document.querySelector(".profile__avatar");

const deleteModal = document.querySelector("#delete-modal");
const deleteForm = document.querySelector("#delete-form");
const deleteCancelBtn = deleteModal?.querySelector(".modal__submit-cncl");
const deleteSubmitBtn = deleteModal?.querySelector(".modal__submit-dlt");
let cardToDelete = null;

const previewModal = document.querySelector("#preview-image-modal");
const previewImageEl = previewModal.querySelector(".modal__image");
const previewCaptionEl = previewModal.querySelector(".modal__caption");

const cardTemplate = document.querySelector("#card-template");
const cardsList = document.querySelector(".cards__list");

function getCardElement(data) {
  let cardElement = cardTemplate.content.querySelector(".card").cloneNode(true);
  const cardImageEl = cardElement.querySelector(".card__image");
  const cardTitleEl = cardElement.querySelector(".card__title");

  cardTitleEl.textContent = data.name;
  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;

  cardImageEl.addEventListener("click", () => {
    previewImageEl.src = data.link;
    previewImageEl.alt = data.name;
    previewCaptionEl.textContent = data.name;
    openModal(previewModal);
  });

  const likeButtonEl = cardElement.querySelector(".card__like-btn");

  if (data.isLiked) {
    likeButtonEl.classList.add("card__like-btn_active");
  }

  likeButtonEl.addEventListener("click", () => {
    const isActive = likeButtonEl.classList.contains("card__like-btn_active");
    likeButtonEl.disabled = true;
    api
      .toggleLike(data._id, isActive)
      .then((updatedCard) => {
        if (updatedCard.isLiked) {
          likeButtonEl.classList.add("card__like-btn_active");
        } else {
          likeButtonEl.classList.remove("card__like-btn_active");
        }
      })
      .catch((err) => console.error("Like toggle failed:", err))
      .finally(() => {
        likeButtonEl.disabled = false;
      });
  });

  const cardDeleteButtonEl = cardElement.querySelector(".card__delete-btn");
  cardDeleteButtonEl.addEventListener("click", () => {
    selectedCard = cardElement;
    selectedCardId = data._id;
    openModal(deleteModal);
  });

  return cardElement;
}

function renderCard(item, method = "prepend") {
  const cardElement = getCardElement(item);
  cardsList[method](cardElement);
}

function handleEscKey(evt) {
  if (evt.key === "Escape") {
    const openedModal = document.querySelector(".modal_is-opened");
    if (openedModal) {
      if (openedModal === deleteModal) {
        cardToDelete = null;
      }
      closeModal(openedModal);
    }
  }
}

function openModal(modal) {
  modal.classList.add("modal_is-opened");
  document.addEventListener("keydown", handleEscKey);
}

function closeModal(modal) {
  modal.classList.remove("modal_is-opened");
  document.removeEventListener("keydown", handleEscKey);
}

editProfileBtn.addEventListener("click", function () {
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;
  resetValidation(editProfileForm, settings);
  openModal(editProfileModal);
});

newPostBtn.addEventListener("click", function () {
  openModal(newPostModal);
});

function handleEditProfileSubmit(evt) {
  evt.preventDefault();

  const submitBtn = editProfileForm.querySelector(".modal__submit-btn");
  const prevText = submitBtn ? submitBtn.textContent : null;
  if (submitBtn) {
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;
  }

  api
    .editUserInfo({
      name: editProfileNameInput.value,
      about: editProfileDescriptionInput.value,
    })
    .then((user) => {
      profileNameEl.textContent = user.name;
      profileDescriptionEl.textContent = user.about;

      closeModal(editProfileModal);
      resetValidation(editProfileForm, settings);
    })
    .catch(console.error)
    .finally(() => {
      if (submitBtn) {
        submitBtn.textContent = prevText ?? "Save";
        submitBtn.disabled = false;
      }
    });
}
function handleAvatarSubmit(evt) {
  evt.preventDefault();
  const submitBtn = avatarForm.querySelector(".modal__submit-btn");
  const prevText = submitBtn ? submitBtn.textContent : null;
  if (submitBtn) {
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;
  }

  const val = avatarInput?.value?.trim() ?? "";
  if (!val) {
    if (avatarError) avatarError.textContent = "Please enter an avatar URL.";
    if (submitBtn) {
      submitBtn.textContent = prevText ?? "Save";
      submitBtn.disabled = false;
    }
    return;
  }

  api
    .editAvatarInfo({ avatar: val })
    .then((user) => {
      if (profileAvatarEl) {
        profileAvatarEl.src = (user && user.avatar) || val;
        profileAvatarEl.alt = `${(user && user.name) || ""}'s avatar`;
      }
      try {
        localStorage.setItem("profileAvatar", (user && user.avatar) || val);
      } catch (e) {}
      closeModal(avatarModal);
      resetValidation(avatarForm, settings);
    })
    .catch((err) => {
      console.error(err);
      if (avatarError)
        avatarError.textContent = "Failed to update avatar. Please try again.";
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.textContent = prevText ?? "Save";
        submitBtn.disabled = false;
      }
    });
}
avatarForm?.addEventListener("submit", handleAvatarSubmit);

avatarModalBtn.addEventListener("click", function () {
  openModal(avatarModal);
});

editProfileForm.addEventListener("submit", handleEditProfileSubmit);

function handleNewPostSubmit(evt) {
  evt.preventDefault();

  const inputValues = {
    name: newPostCaptionInput.value,
    link: newPostImageInput.value,
  };

  const submitBtn = newPostForm.querySelector(".modal__submit-btn");
  const prevText = submitBtn.textContent;
  submitBtn.textContent = "Saving...";
  submitBtn.disabled = true;

  api
    .addCard(inputValues)
    .then((newCard) => {
      renderCard(newCard);
      closeModal(newPostModal);
      newPostForm.reset();
      resetValidation(newPostForm, settings);
    })
    .catch((err) => {
      console.error("Card creation failed:", err);
    })
    .finally(() => {
      submitBtn.textContent = prevText;
      submitBtn.disabled = false;
    });
}

newPostForm.addEventListener("submit", handleNewPostSubmit);

deleteForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!selectedCardId) return;

  const prevText = deleteSubmitBtn?.textContent;
  if (deleteSubmitBtn) {
    deleteSubmitBtn.textContent = "Deleting...";
    deleteSubmitBtn.disabled = true;
  }
  if (deleteCancelBtn) deleteCancelBtn.disabled = true;

  api
    .deleteCard(selectedCardId)
    .then(() => {
      selectedCard?.remove();
      selectedCard = null;
      selectedCardId = null;
      closeModal(deleteModal);
    })
    .catch(console.error)
    .finally(() => {
      if (deleteSubmitBtn) {
        deleteSubmitBtn.textContent = prevText || "Delete";
        deleteSubmitBtn.disabled = false;
      }
      if (deleteCancelBtn) deleteCancelBtn.disabled = false;
    });
});

deleteCancelBtn?.addEventListener("click", () => {
  selectedCard = null;
  selectedCardId = null;
  closeModal(deleteModal);
});

const closeButtons = document.querySelectorAll(".modal__close-btn");

closeButtons.forEach((button) => {
  const modal = button.closest(".modal");

  button.addEventListener("click", () => {
    closeModal(modal);

    const form = modal.querySelector(".modal__form");
    if (form) {
      resetValidation(form, settings);
    }
    if (modal === deleteModal) {
      cardToDelete = null;
    }
  });
});
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("mousedown", (e) => {
    if (e.target === modal) {
      closeModal(modal);
      if (modal === deleteModal) {
        cardToDelete = null;
      }
    }
  });
});

enableValidation(settings);

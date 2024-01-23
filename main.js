(() => {
  const api = {
    endpointUrl: 'https://crm-backend-bdn4.onrender.com/api/clients',

    async getClientsList() {
      const response = await fetch(this.endpointUrl);
      const data = await response.json();
      return data;
    },

    async getClient(id) {
      const response = await fetch(this.endpointUrl + `/` + id);
      const data = await response.json();
      return data;
    },

    async createClient(clientItem) {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientItem)
      });
      const data = await response.json();
      return { data, status: response.status };
    },

    async editClient(clientItem) {
      const response = await fetch(this.endpointUrl + `/` + clientItem.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientItem)
      });
      const data = await response.json();
      return { data, status: response.status };
    },

    async deleteClient(clientItem) {
      const response = await fetch(this.endpointUrl + `/` + clientItem.id, {
        method: 'DELETE',
      });
      const data = await response.json();
      return { data, status: response.status };
    }
  }

  const pageElements = {
    table: document.getElementById(`table__main`),
    loadingSpinner: document.getElementById(`loading-spinner`),
    clientsContainer: document.getElementById(`clients__container`),
    tableColumns: document.getElementsByClassName(`table__column`),
    searchInput: document.getElementById(`inp-search-client`),
  }

  function createClientItem(clientObj) { // Создание строки для таблицы

    const itemRow = createElement(`tr`, [`contact-item`]);

    const [id, fullName, createdDate, lastUpdateDate, contacts, actionsButtons] = ['td', 'td', 'td', 'td', 'td', 'td'].map(tag => {
      return createElement(tag, [`col`]);
    });

    contacts.classList.add(`col_contacts`);

    id.textContent = clientObj.id;
    id.classList.add(`id`)
    fullName.textContent = `${clientObj.surname} ${clientObj.name} ${clientObj.lastName}`;
    fullName.classList.add(`fullname`);

    createdDate.append(formattingDate(clientObj.createdAt));
    lastUpdateDate.append(formattingDate(clientObj.updatedAt));

    contacts.append(renderContactsInTable(clientObj));
    actionsButtons.append(createActionsButtons(clientObj));

    itemRow.append(id, fullName, createdDate, lastUpdateDate, contacts, actionsButtons)

    return itemRow
  }

  function renderContactsInTable(clientObj) { // Создание контактов для клиента (в таблице)
    const contactsContainer = createElement(`ul`, [`list-reset`, `contacts-container`]);
    const maxVisibleContacts = 4;
    let invisibleContacts = null;

    clientObj.contacts.forEach((contact, index) => {
      const contactItem = createElement(`li`, [`contact__item`]);
      const contactLink = createElement(`a`, [`contact__link`]);

      if (index >= maxVisibleContacts) { // Проверка на кол-во контактов. Если больше 4, то следующие скрываются.
        contactItem.classList.add(`contact__item_hidden`);
        if (!invisibleContacts) {
          invisibleContacts = createElement(`button`, [`btn`, `btn_show-contacts`], `+${clientObj.contacts.length - maxVisibleContacts}`);
          invisibleContacts.addEventListener(`click`, () => { // Функция показа всех контактов
            const moreContacts = contactsContainer.getElementsByClassName('contact__item_hidden');
            Array.from(moreContacts).forEach((moreContact) => {
              moreContact.classList.remove(`contact__item_hidden`);
            });
            invisibleContacts.classList.add(`visually-hidden`)
          })
          contactsContainer.insertBefore(invisibleContacts, contactsContainer.children[maxVisibleContacts]);
        }
      }

      switch (contact.type) {
        case 'Телефон':
          contactLink.href = `tel:` + contact.value;
          contactLink.classList.add(`contact__item_phone`);
          break;
        case 'Email':
          contactLink.href = `mailto:` + contact.value;
          contactLink.classList.add(`contact__item_mail`);
          break;
        case 'Facebook':
          contactLink.href = contact.value;
          contactLink.classList.add(`contact__item_fb`);
          break;
        case 'ВКонтакте':
          contactLink.href = contact.value;
          contactLink.classList.add(`contact__item_vk`);
          break;
        default:
          contactLink.href = contact.value;
          break;
      };
      contactLink.append(createContactTooltip(contact));
      contactItem.append(contactLink);
      contactsContainer.append(contactItem);
    })

    return contactsContainer;
  }


  function createContactTooltip(contact) { // Всплывающая подсказка для контакта
    const contactTooltip = createElement(`span`, [`contact__tooltip`, `tooltip`], `${contact.type}: `);
    const contactTooltipValue = createElement(`span`, [`tooltip__value`], `${(contact.value).replace(/https?:\/\//, '')}`);
    contactTooltip.append(contactTooltipValue);
    return contactTooltip
  }

  function createActionsButtons({ id }) { // Создание кнопок для элемента таблицы
    const actionsButtonsItem = createElement(`div`, [`col_actions`]);
    const editButton = createElement(`button`, [`btn`, `btn_edit-client`], `Изменить`);
    const deleteButton = createElement(`button`, [`btn`, `btn_delete-client`], `Удалить`);
    console.log(id);

    editButton.addEventListener(`click`, async () => {
      editButton.classList.toggle(`btn_edit-client_active`);
      const client = await api.getClient(id);
      openClientModalWindow(client);
      editButton.classList.toggle(`btn_edit-client_active`);
    })
    deleteButton.addEventListener(`click`, async () => {
      deleteButton.classList.toggle(`btn_delete-client_active`);
      const client = await api.getClient(id);
      openDeleteModalWindow(client);
      deleteButton.classList.toggle(`btn_delete-client_active`);
    });

    actionsButtonsItem.append(editButton, deleteButton);
    return actionsButtonsItem;
  }

  function openDeleteModalWindow(clientObj) { // Открытие модального окна удаления

    const modalWindow = createElement(`dialog`, [`modal`, `modal-delete-client`, `animate__animated`, `animate__fadeInDown`]);
    const modalTop = createElement(`div`, [`modal__top`]);
    const contacts = createElement(`div`, [`modal__bottom`]);
    const title = createElement(`h2`, [`modal__title`], `Удалить клиента`);
    const text = createElement(`p`, [`text-confirm`], `Вы действительно хотите удалить данного клиента?`)

    const errorText = createElement(`p`, [`text-error`])

    const closeButton = createElement(`buttton`, [`btn`, `btn_close`]);
    const submitButton = createElement(`button`, [`btn`, `btn_submit`], `Удалить`);
    const cancelButton = createElement(`button`, [`btn`, `btn_cancel`], `Отмена`);

    modalTop.append(title);
    modalWindow.append(closeButton, modalTop, contacts, text, submitButton, cancelButton);

    pageElements.clientsContainer.append(modalWindow);
    modalWindow.showModal();

    addCloseModalEvent(cancelButton, closeButton, modalWindow);
    addClientDeleteEvent(submitButton, clientObj, modalWindow, errorText, contacts);
  }

  function openClientModalWindow(clientObj) { // Открытие модального окна редактирования или добавления нового контакта

    const modalWindow = createElement(`dialog`, [`clients__edit-modal`, `modal`, `animate__animated`, `animate__fadeInDown`]);

    const modalTop = createElement(`div`, [`modal__top`]);
    const closeButton = createElement(`buttton`, [`btn`, `btn_close`]);
    const title = createElement(`h2`, [`modal__title`]);

    const form = createElement(`form`, [`modal__form`, `form`]);

    const formTop = createElement(`div`, [`form__top`]);
    const surnameLabel = createElement(`label`, [`form__label`]);
    const surnameSpan = createElement(`span`, [`form__text`, `form__text_required`], `Фамилия`);
    const surnameInput = createElement(`input`, [`form__input`]);
    surnameLabel.append(surnameSpan, surnameInput);

    const nameLabel = createElement(`label`, [`form__label`]);
    const nameSpan = createElement(`span`, [`form__text`, `form__text_required`], `Имя`);
    const nameInput = createElement(`input`, [`form__input`]);
    nameLabel.append(nameSpan, nameInput);

    const lastNameLabel = createElement(`label`, [`form__label`]);
    const lastNameSpan = createElement(`span`, [`form__text`], `Отчество`);
    const lastNameInput = createElement(`input`, [`form__input`]);
    lastNameLabel.append(lastNameSpan, lastNameInput);

    const contacts = createElement(`div`, [`contacts-modal`])

    const buttonAddContact = createElement(`button`, [`btn`, `btn_add-contact`], `Добавить контакт`);

    const errorText = createElement(`p`, [`text-error`])

    const submitButton = createElement(`button`, [`btn`, `btn_submit`], `Сохранить`);
    const cancelButton = createElement(`button`, [`btn`, `btn_cancel`], `Удалить клиента`);

    formTop.append(surnameLabel, nameLabel, lastNameLabel);
    modalTop.append(closeButton, title);
    contacts.append(buttonAddContact)
    form.append(formTop, contacts, submitButton, cancelButton);
    modalWindow.append(modalTop, form);
    pageElements.clientsContainer.append(modalWindow);

    modalWindow.showModal();
    errorTextRemover([surnameInput, nameInput, lastNameInput], errorText); // Удаление текста с ошибкой после начала ввода новых данных

    if (clientObj === null) {
      title.textContent = `Новый клиент`;
      cancelButton.textContent = `Отмена`

      addCloseModalEvent(cancelButton, closeButton, modalWindow);
      addClientChangeEvent(`create`);
      contactsInModal(null, errorText, contacts, buttonAddContact);

    } else {
      title.textContent = `Изменить данные`;

      surnameInput.value = clientObj.surname;
      nameInput.value = clientObj.name;
      lastNameInput.value = clientObj.lastName;

      const id = createElement(`span`, [`modal__id`], `ID: ${clientObj.id}`);
      modalTop.append(id);

      addClientDeleteEvent(cancelButton, clientObj, modalWindow, errorText, contacts)
      addCloseModalEvent(null, closeButton, modalWindow);
      addClientChangeEvent(`edit`);
      contactsInModal(clientObj, errorText, contacts, buttonAddContact);
    }

    function addClientChangeEvent(status) { // Добавление клиента в список (функция для модального окна)

      submitButton.addEventListener(`click`, async (e) => { // Прослушиватель кнопки
        e.preventDefault();

        let cancelAddStudent = false;

        const formImputsRequired = [surnameInput, nameInput];

        const contactsList = getContactsFromForm(modalWindow); // Получение добвленных контактов (если таковые есть)

        contactsList.forEach(element => {
          if (element.value.trim().length === 0) {

            cancelAddStudent = true;
            errorText.textContent = `Ошибка: Одно из полей в контактах пустое`
            contacts.after(errorText);
          }
        });

        formImputsRequired.forEach(element => { // Проверка на пробелы в поля
          if (element.value.trim().length === 0) {

            cancelAddStudent = true;
            errorText.textContent = `Ошибка: Одно из полей пустое`
            contacts.after(errorText);
          }
        });

        if (!cancelAddStudent) {
          submitButton.classList.add(`btn_submit_active`);
          let response;

          if (status === `edit`) {
            response = await api.editClient({
              id: clientObj.id,
              name: nameInput.value,
              surname: surnameInput.value,
              lastName: lastNameInput.value,
              contacts: contactsList,
            })
          }

          if (status === `create`) {
            response = await api.createClient({
              name: nameInput.value,
              surname: surnameInput.value,
              lastName: lastNameInput.value,
              contacts: contactsList,
            })
          }

          lookResponse(response, modalWindow, errorText, contacts);
          submitButton.classList.remove('btn_submit_active')
        }
      })
    }
  }

  function contactsInModal(clientObj, errorText, contacts, buttonAddContact) {
    const contactsContainer = createElement(`ul`, [`list-reset`, `contacts-modal__list`]);

    let isContactsContainerAdded

    buttonAddContact.addEventListener(`click`, async (e) => { // Прослушиватель кнопки добавления нового контакта
      e.preventDefault();
      contactsContainer.append(createContactItem({ type: `Телефон`, value: null }, contactsContainer, buttonAddContact));
      if (!isContactsContainerAdded) contacts.prepend(contactsContainer);
      if (isContactsContainerFull(contactsContainer)) {
        buttonAddContact.classList.add(`visually-hidden`);
      }
    })

    if ((clientObj !== null) && (clientObj.contacts.length !== 0)) {
      clientObj.contacts.forEach((contact) => {
        contactsContainer.append(createContactItem(contact, contactsContainer, buttonAddContact))
      })
      contacts.prepend(contactsContainer);
      isContactsContainerAdded = true
    }
  }

  function isContactsContainerFull(container) {
    return container.getElementsByClassName(`contacts-modal__item`).length === 10;
  }

  function createContactItem(contact, contactsContainer, buttonAddContact) { // Создание элемента контактов
    const contactItem = createElement(`li`, [`contacts-modal__item`]);
    const contactType = createElement(`span`, [`contacts-modal__selected-type`], `${contact.type}`)
    const contactTypeSelector = createElement(`div`, [`contacts-modal__type-selector`]);
    const contactInput = createElement(`input`, [`contacts-modal__input`], `${contact.value}`);
    const contactDeleteButton = createElement(`button`, [`btn`, `btn_delete-modal`]);

    const contactTypesContainer = createElement(`ul`, [`list-reset`, `contacts-modal__options`, `options`]);
    const phoneItem = createElement(`li`, [`options__item`], `Телефон`);
    const emailItem = createElement(`li`, [`options__item`], `Email`);
    const facebookItem = createElement(`li`, [`options__item`], `Facebook`);
    const vkItem = createElement(`li`, [`options__item`], `ВКонтакте`);
    const anotherItem = createElement(`li`, [`options__item`], `Другое`);


    contactInput.placeholder = `Введите данные контакта`
    contactInput.value = contact.value;

    const contactTypes = [phoneItem, emailItem, facebookItem, vkItem, anotherItem];

    contactTypesContainer.append(...contactTypes);
    contactTypeSelector.append(contactType, contactTypesContainer);

    contactItem.append(contactTypeSelector, contactInput, contactDeleteButton);


    contactTypeSelector.addEventListener(`click`, () => { // Открытие списка возможных типов контакта
      contactTypeSelector.classList.toggle(`active`)
    })

    contactTypes.forEach(selectedType => { // Выбор типо контакта
      selectedType.addEventListener(`click`, () => {
        contactType.textContent = selectedType.textContent;
      })
    })

    contactDeleteButton.addEventListener(`click`, async (e) => { // Кнопка удаления контакта
      e.preventDefault();
      contactItem.remove();

      if (!isContactsContainerFull(contactsContainer)) { // Проверка на кол-во контактов
        buttonAddContact.classList.remove(`visually-hidden`);
      }
    })

    return contactItem
  }

  async function pagePreparation() { // Загрузка страницы

    const addClientButton = createElement(`button`, [`btn`, `btn_secondary`, `btn_add-client`], `Добавить клиента`);
    closeElement(pageElements.loadingSpinner);

    addClientButton.addEventListener(`click`, () => openClientModalWindow(null))
    pageElements.clientsContainer.append(addClientButton);
  }

  function sortClientsList(arr, prop, dir = false) { // Сортировка массива
    const newArr = [...arr]
    return newArr.sort((a, b) => (!dir ? a[prop] < b[prop] : a[prop] > b[prop]) ? -1 : 1);
  }

  function eventlistenerSortForm() { // Сортировка клиентов
    const tableColumns = Array.from(pageElements.tableColumns).splice(0, 4);

    tableColumns.forEach(column => {
      column.addEventListener(`click`, async () => {
        const clientsList = await api.getClientsList();

        let sortDirection = column.getAttribute("data-sort-direction") === "asc" ? "desc" : "asc";
        column.setAttribute("data-sort-direction", sortDirection);

        if (sortDirection === `asc`) {
          tableColumns.forEach(column => column.classList.remove(`table__column_sorted`));
          column.classList.add(`table__column_sorted`);
          renderClientsList(sortClientsList(clientsList, column.id), pageElements.table);
          return;
        }

        if (sortDirection == `desc`) {
          column.classList.remove(`table__column_sorted`);
          renderClientsList(sortClientsList(clientsList, column.id, true), pageElements.table);
          return;
        }

      })
    });
  }

  function renderClientsList(clientsList) { // Функция отрисовки всех клиентов
    pageElements.table.innerHTML = ``;

    clientsList.forEach(client => {
      pageElements.table.append(createClientItem(client));
    });
  }

  function eventlistenerSearch() { // Поиск клиентов
    const debouncedRender = debounce(async () => {
      let clientsList = await api.getClientsList();

      if (pageElements.searchInput.value !== ``) clientsList = filterArr(clientsList, pageElements.searchInput.value, `name`, `surname`, `lastName`, `id`);

      renderClientsList(clientsList, pageElements.table);
    }, 300);

    pageElements.searchInput.addEventListener(`input`, (e) => {
      e.preventDefault;
      debouncedRender();
    });
  }

  // Вспомогательные функции

  function filterArr(arr, values, ...props) { // Функция сортировки, которая принимает массив объектов, данные для поиска и свойства, по которым нужно делать поиск
    const strings = values.split(` `).filter(item => item.trim() !== ``);

    return arr.filter(item =>
      strings.some(value =>
        props.some(prop =>
          String(item[prop]).includes(value)
        )
      )
    );
  }

  function createElement(tag, classNames, textContent) { // Создание элемента с классом(и) и текстом
    const element = document.createElement(tag);

    if (classNames) {
      element.classList.add(...classNames);
    }

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  function errorTextRemover(inputsArr, text) { // Убирает текст ошибки
    inputsArr.forEach(input => {
      input.addEventListener(`input`, () => {
        text.remove();
      })
    })
  }

  function getContactsFromForm(modalWindow) {
    const newContactsList = [];
    const contactsItems = Array.from(modalWindow.getElementsByClassName(`contacts-modal__item`));
    contactsItems.forEach(item => {
      const contact = {
        type: item.querySelector(`.contacts-modal__selected-type`).textContent,
        value: item.querySelector(`.contacts-modal__input`).value,
      }
      newContactsList.push(contact);
    })

    return newContactsList;
  }

  function formattingDate(dateString) {
    const date = new Date(dateString);

    const dateContainer = createElement(`div`, [`date-and-time-container`]);
    const dateItem = createElement(`span`, [`date`],
      `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`);
    const timeItem = createElement(`span`, [`time`],
      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);

    dateContainer.append(dateItem, timeItem)

    return dateContainer;
  }

  function closeElement(element) { // Закрытие элемента
    element.classList.add(`animate__fadeOutDown`);
    setTimeout(() => {
      element.remove()
    }, 400);
  }

  function debounce(func, ms) {
    let timeout;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, arguments), ms);
    };
  }

  async function lookResponse(response, modalWindow, errorText, contacts) { // Просмотр ответа сервера на запрос
    try {
      switch (response.status) {
        case 200:
          await handleStatus200(modalWindow);
          break;
        case 201:
          await handleStatus201(response, modalWindow);
          break;
        default:
          handleError(response, errorText, contacts);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleStatus200(modalWindow) {
    const clientsList = await api.getClientsList();
    renderClientsList(clientsList);

    if (modalWindow !== null) {
      closeElement(modalWindow);
    }
  }

  async function handleStatus201(response, modalWindow) {
    const newClient = createClientItem(response.data);
    newClient.classList.add(`animate__animated`, `animate__bounceInRight`);
    pageElements.table.append(newClient);
    closeElement(modalWindow);
  }

  function handleError(response, errorText, contacts) {
    errorText.textContent = `Ошибка: Код ${response.status}. Место ошибки: ${response.status.field}. ${response.data.message}`;
    contacts.after(errorText);
  }

  function addCloseModalEvent(cancelButton, closeButton, modalWindow) { // Добавление ивента закрытия модального окна
    if (cancelButton !== null) {
      cancelButton.addEventListener(`click`, (e) => {
        e.preventDefault()
        closeElement(modalWindow)
      });
    }
    closeButton.addEventListener(`click`, () => closeElement(modalWindow));
  }

  function addClientDeleteEvent(button, { id }, modalWindow, errorText, contacts) { // Добавление ивента удаления клиента
    button.addEventListener(`click`, async (e) => {
      e.preventDefault()

      button.classList.add(`btn_submit_active`);
      const response = await api.deleteClient({ id: id });

      lookResponse(response, modalWindow, errorText, contacts)
      button.classList.remove('btn_submit_active')
    })
  }

  function delay(ms) { // задержка
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  async function clientsListApp() { // Инициализация программы
    const clientsList = await api.getClientsList();
    await pagePreparation();

    renderClientsList(clientsList);
    eventlistenerSortForm();
    eventlistenerSearch();
  }

  window.clientsListApp = clientsListApp;
})();

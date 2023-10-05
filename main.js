import { CLOSE_ICON, MESSAGE_ICON, styles } from "./assets.js";

const GROUP_NAME = "Benin FRASED Helpdesk"                              //TODO: modify as appropriate
const GROUP_ID = "8"                                                    //TODO: modify as appropriate
const PROGRAM_BASE = "benin"                                            //TODO: modify as appropriate
const API_URL = `https://apis.livingseed.net/${PROGRAM_BASE}/tickets`

class MessageWidget {
  constructor(position = "bottom-left") {
    this.position = this.getPosition(position);
    this.open = false;
    this.initialize();
    this.injectStyles();
    //add
    this.fileData = "";
    this.fileName = "";
    this.fileType = "";
    this.hasAttachment = false;
  }

  position = "";
  open = false;
  widgetContainer = null;
  //added
  hasAttachment = false;
  fileData = "";
  fileName = "";
  fileType = "";
  
  getPosition(position) {
    const [vertical, horizontal] = position.split("-");
    return {
      [vertical]: "30px",
      [horizontal]: "30px",
    };
  }

  async initialize() {
    /**
     * Create and append a div element to the document body
     */
    const container = document.createElement("div");
    container.style.position = "fixed";
    Object.keys(this.position).forEach(
      (key) => (container.style[key] = this.position[key])
    );
    //set z-index
    container.style.zIndex = "9999"; //this ensures it stays on top of other layers
    document.body.appendChild(container);

    /**
     * Create a button element and give it a class of button__container
     */
    const buttonContainer = document.createElement("button");
    buttonContainer.classList.add("button__container");
    buttonContainer.setAttribute('title', "Bureau d'aide");

    /**
     * Create a span element for the widget icon, give it a class of `widget__icon`, and update its innerHTML property to an icon that would serve as the widget icon.
     */
    const widgetIconElement = document.createElement("span");
    widgetIconElement.innerHTML = MESSAGE_ICON;
    widgetIconElement.classList.add("widget__icon");
    this.widgetIcon = widgetIconElement;

    /**
     * Create a span element for the close icon, give it a class of `widget__icon` and `widget__hidden` which would be removed whenever the widget is closed, and update its innerHTML property to an icon that would serve as the widget icon during that state.
     */
    const closeIconElement = document.createElement("span");
    closeIconElement.innerHTML = CLOSE_ICON;
    closeIconElement.classList.add("widget__icon", "widget__hidden");
    this.closeIcon = closeIconElement;

    /**
     * Append both icons created to the button element and add a `click` event listener on the button to toggle the widget open and close.
     */
    buttonContainer.appendChild(this.widgetIcon);
    buttonContainer.appendChild(this.closeIcon);
    buttonContainer.addEventListener("click", this.toggleOpen.bind(this));

    /**
     * Create a container for the widget and add the following classes:- `widget__hidden`, `widget__container`
     */
    this.widgetContainer = document.createElement("div");
    this.widgetContainer.classList.add("widget__hidden", "widget__container");

    /**
     * Invoke the `createWidget()` method
     */
    this.createWidgetContent();

    /**
     * Append the widget's content and the button to the container
     */
    container.appendChild(this.widgetContainer);
    container.appendChild(buttonContainer);

    /**
     * Add submit handler for the form
     */
    const ticketForm = document.getElementById('ticketForm')

    ticketForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const formData = new FormData(ticketForm)

      //build output
      const attachment = [{
        'filename'  : this.fileName,
        'data'      : this.fileData,
        'mime-type' : this.fileType,
      }]

      const data = {
        'title'           : formData.get("program") === "None" ? formData.get("subject") : formData.get("program") + ": " + formData.get("subject"),  
        'group_id'        : GROUP_ID,
        'group'           : GROUP_NAME,  
        'customer_id'     : "guess:"  + formData.get("email"),  
        'customer_name'   : formData.get("name"),
        'content'         : formData.get("message"),
        'tags'            : "online", 
        'article'         : {
                              'subject'       : formData.get("subject"),
                              'reply_to'      : formData.get("email"),
                              'from'          : formData.get("name") + " <" + formData.get("email") + ">",
                              'to'            : GROUP_NAME,
                              'body'          : formData.get("message"),
                              'type'          : "email",
                              'sender'        : "Customer",
                              'internal'      : false,
                              'content_type'  : "text/html",
                            }
      }

      //output
      let output
      if (this.hasAttachment) output = { ...data, article: { ...data.article, "attachments": attachment }}
      else output = { ...data }
      
      //post output
      fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(output),
      })
      .then(response => {
        console.log(`${response.status} - ${response.statusText}`)
        // confirm
        this.createWidgetResponseContent()
      })
      .catch(error => {
        alert("Erreur lors de l'envoi du message au service d'assistance !")
        console.log(error)
        this.toggleOpen()
      })      
    })

    /**
     * add file upload handler
     */
    const attachmentFile = document.getElementById('attachmentFile')
    // attachmentFile.style.opacity = 0;

    attachmentFile.addEventListener("change", (e) => {
      //define reader
      const reader = (readFile) =>
          new Promise((resolve, reject) => {
              const fileReader = new FileReader()
              fileReader.onloadend = () => resolve(fileReader.result)
              fileReader.readAsDataURL(readFile)
          })

      if (e.target.files.length > 0) {
        
        this.fileType = e.target.files[0].type  
        this.fileName = e.target.files[0].name  
        this.hasAttachment = true

        reader(e.target.files[0]).then((result) => {          
          this.fileData = result.split(';base64,').pop()          
        })
      }
    })
  }

  createWidgetContent() {    
    this.widgetContainer.innerHTML = `
      <div class="container__header">
        <header class="widget__header">
          <h3>FRASED Bureau d'aide</h3>
          <p>Remplissez le formulaire ci-dessous et cliquez sur ENVOYER LE MESSAGE pour envoyer.</p>          
        </header>  
      </div>
      <div class="container__content">
        <form id="ticketForm">
            <div class="form__field">
                <label for="name">Nom*</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autocomplete="off"
                  required
                  placeholder="Entrez votre nom complet"
                />
            </div>
            <div class="form__field">
                <label for="email">Email*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  autocomplete="on"
                  placeholder="Entrer votre Email"
                />
            </div>
            <div class="form__field">
              <label for="program">Programme*</label>
              <input
                  type="text"
                  id="program"
                  name="program"
                  autocomplete="off"
                  value="FRASED Benin"
                  readonly
              />
            </div>
            <div class="form__field">
                <label for="subject">Sujet*</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  autocomplete="off"
                  required
                  placeholder="Entrez le sujet du message"
                />
            </div>
            <div class="form__field">
                <label for="message">Message*</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Entrez une brève description de votre problème ici..."
                  required
                  rows="6"
                ></textarea>
            </div> 
            <div class="form__field"> 
              <label for="attachmentFile">Joindre un fichier (si nécessaire)</label>      
              <input 
                id="attachmentFile"
                name="attachmentFile"
                accept=".doc,.docx,.pdf,image/*"
                type="file"
              />
            </div>
            <button>Envoyer le message</button>
        </form>
      </div>
      <div class="container__footer">
        <p>La réponse sera envoyée à votre adresse e-mail</p>
      </div>
    `;    
  }   

  createWidgetResponseContent() {    
    this.widgetContainer.innerHTML = `
      <header class="widget__header">
        <h3>FRASED Bureau d'aide</h3>
        <p>Merci de nous avoir contactés.<br />Veuillez vérifier votre courrier électronique pour notre réponse.<br />Que Dieu vous bénisse.</p>
      </header>
      `;
  }

  injectStyles() {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styles.replace(/^\s+|\n/gm, "");
    document.head.appendChild(styleTag);
  }

  toggleOpen() {
    this.open = !this.open;
    if (this.open) {
      this.widgetIcon.classList.add("widget__hidden");
      this.closeIcon.classList.remove("widget__hidden");
      this.widgetContainer.classList.remove("widget__hidden");
    } else {
      this.createWidgetContent();
      this.widgetIcon.classList.remove("widget__hidden");
      this.closeIcon.classList.add("widget__hidden");
      this.widgetContainer.classList.add("widget__hidden");
    }
  }
}

function initializeWidget() {
  return new MessageWidget();
}

initializeWidget();
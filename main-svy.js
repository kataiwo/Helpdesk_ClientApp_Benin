import { CLOSE_ICON, MESSAGE_ICON, styles } from "./assets.js";

const GROUP_NAME = "Benin FRASED Helpdesk"                              //TODO: modify as appropriate
const GROUP_ID = "8"                                                    //TODO: modify as appropriate
const PROGRAM_BASE = "benin"                                            //TODO: modify as appropriate
const API_URL = `https://apis.livingseed.net/${PROGRAM_BASE}/tickets`

const surveyJson = {
  pages: [
      {
        name: "Personal",
        title: "Informations personnelles",        
        elements: [
          {
            name: "personal-information",            
            type: "panel",
            // state: "expanded",
            elements: [
              {
                name: "name",
                title: "Nom:",
                titleLocation: "left",
                placeholder: "Entrez votre nom complet ici",
                type: "text",
                isRequired: true,
                requiredErrorText: "Votre nom est obligatoire"
              }, 
              {
                  name: "email",
                  title: "E-mail:",
                  titleLocation: "left",
                  placeholder: "Entrez votre email ici",
                  type: "text",
                  isRequired: true,
                  requiredErrorText: "Votre email est requis",
                  validators: [
                    { "type": "email", "text": "La valeur doit être un e-mail valide" }
                  ]
              }, 
              // {
              //   name: "telNo",
              //   title: "WhatsApp n°:",
              //   titleLocation: "left",
              //   placeholder: "Numéro WhatsApp avec code pays",
              //   type: "text",
              //   isRequired: false,
              //   description: "Fournissez-le uniquement si vous souhaitez que nous vous contactions",
              //   descriptionLocation: "underInput"
              // }, 
            ]
          }, 
          {        
            name: "program",
            title: "Programme:",
            titleLocation: "left",
            isRequired: true,
            type: "dropdown",
            showNoneItem: true,
            showOtherItem: false,
            choices: ["Nigeria MILERT", "South-Africa MILERT", "Ghana MILERT", "Liberia MILERT", "Canada MILERT", "Malawi MILERT",
                      "Languages MILERT", "FRASED Abidjan", "FRASED Benin"],
            defaultValue: "FRASED Benin",
            readOnly: true,
          },
        ]
      },
      { 
        name: "Issues",
        title: "Problèmes rencontrés",
        description: "Décrivez le défi que vous rencontrez.",
        elements: [
          {
            name: "issues-encountered",
            // title: "Issues Encountered",
            type: "panel",
            // state: "expanded",
            elements: [
              {
                name: "subject",
                title: "Sujet",
                // titleLocation: "left",
                placeholder: "Entrez le sujet de votre problème",
                type: "text",
                isRequired: true,
                requiredErrorText: "La valeur ne peut pas être vide"
              }, 
              {
                name: "message",
                title: "Message",
                type: "comment",    
                isRequired: true,
                placeholder: "Entrez une brève description de votre problème ici...",
                maxLength: 600,
                allowResize: false
              }, 
            ]
          },
          { 
            name: "file-upload",            
            type: "panel",
            title: "Téléchargez le fichier (si nécessaire)",
            description: "Si nécessaire, cliquez ici pour télécharger (max 500 Ko)...",
            state: "collapsed",
            elements: [
              {
                "type": "file",
                "title": "Téléchargez votre fichier",
                "name": "files",
                "storeDataAsText": true,
                "waitForUpload": true,
                "allowMultiple": false,
                "maxSize": 512000, //=500kb, 1048576, //=1mb 102400, //=100kb
                "hideNumber": true,
                'acceptedTypes': ".doc,.docx,.pdf,image/*"
              }
            ]
          }
        ]
      }
    ],
    showQuestionNumbers: false,
    fitToContainer: true,
    completedHtml: "Merci, veuillez vérifier votre courrier électronique pour notre réponse.<br />Que Dieu vous bénisse.",
    completeText: "Envoyer"
};

class MessageWidget {
  constructor(position = "bottom-left") {
    this.position = this.getPosition(position);
    this.open = false;
    this.initialize();
    this.injectStyles();
  }

  position = "";
  open = false;
  widgetContainer = null;

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
    document.body.appendChild(container);

    /**
     * Create a button element and give it a class of button__container
     */
    const buttonContainer = document.createElement("button");
    buttonContainer.classList.add("button__container");

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
  }

  createWidgetContent() {
    this.widgetContainer.innerHTML = `
      <header class="widget__header">
        <h3>Contacter le service d'assistance FRASED</h3>
        <p>La réponse sera envoyée à votre email</p>
      </header>
      <div id="surveyContainer"></div>
    `;

    //attachment
    let hasAttachment = false
    //add survey
    const survey = new Survey.Model(surveyJson);

    $(function() {
        $("#surveyContainer").Survey({ model: survey });
    });

    function saveSurveyResults(outputJson) {
      //save
      fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(outputJson),
      })
      .then(response => console.log(`${response.status} - ${response.statusText}`))
      .catch(error => {
        alert("Erreur lors de l'envoi du message au service d'assistance !")
        console.log(error)
      })
    }

    function surveyComplete (sender) {
      var newData = sender.data
      //parse attachments
      let fileName = ''
          ,fileType = ''
          ,fileData = ''

      if (sender.data.hasOwnProperty('files')) {
        fileName = sender.data.files[0].name
        fileType = sender.data.files[0].type
        fileData = sender.data.files[0].content.split('base64,').pop()
        hasAttachment = true        
      }

      //then delete files property        
      if (hasAttachment) delete newData['files']     

      //build output
      const attachment = [{
        'filename'  : fileName,
        'data'      : fileData,
        'mime-type' : fileType,
      }]

      const data = {
        'title'       : newData.program + ": " + newData.subject,  
        'group_id'    : GROUP_ID,
        'group'       : GROUP_NAME,  
        'customer_id' : "guess:"  + newData.email,  
        'tags'        : "online", 
        'article'     : {
                          'subject'       : newData.subject,
                          'reply_to'      : newData.email,
                          'from'          : newData.name + " <" + newData.email + ">",
                          'to'            : GROUP_NAME,
                          'body'          : newData.message,
                          'type'          : "email",
                          'sender'        : "Customer",
                          'internal'      : false,
                          'content_type'  : "text/html",
                        }
      }

      //output
      let output
      if (hasAttachment) output = { ...data, article: { ...data.article, attachments: attachment }}
      else output = { ...data }
                     
      //save
      saveSurveyResults(output)
    }

    //on complete
    survey.onComplete.add(surveyComplete);
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


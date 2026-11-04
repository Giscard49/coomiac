import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AdminLang = "en" | "fr";

const en = {
  language: {
    label: "Language",
    english: "English",
    french: "Français",
  },
  common: {
    loading: "Loading…",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    translate: "Translate",
    signOut: "Sign out",
    backWebsite: "Back to website",
    viewSite: "View site",
    light: "Light",
    dark: "Dark",
    retry: "Retry",
    technicalDetails: "Technical details",
    signedIn: "Signed in",
    email: "Email",
    password: "Password",
    statusNew: "New",
    statusReplied: "Replied",
    statusAwaiting: "Awaiting reply",
    noCompany: "No company",
    unnamed: "Unnamed",
    openMessages: "Open messages",
    viewConversation: "View conversation",
    reply: "Reply",
  },
  nav: {
    overview: "Overview",
    messages: "Messages",
    products: "Products",
    gallery: "Photo gallery",
    label: "Admin sections",
  },
  headings: {
    overview: {
      title: "Overview",
      subtitle: "Your catalogue, gallery and incoming messages at a glance.",
    },
    inbox: {
      title: "Messages",
      subtitle: "Read every inquiry and reply directly from the official COOMIAC email address.",
    },
    products: {
      title: "Products",
      subtitle: "Publish and translate the minerals shown on the public site.",
    },
    gallery: {
      title: "Photo gallery",
      subtitle: "Manage the photographs displayed in the public gallery.",
    },
  },
  shell: {
    backPublic: "Back to the public website",
    workspace: "Workspace",
    loadingWorkspace: "Loading workspace…",
    redirecting: "Redirecting to sign in…",
    checkingAccess: "Checking access…",
    toggleDark: "Toggle dark mode",
    adminSuffix: "COOMIAC Admin",
  },
  access: {
    restricted: "Restricted area",
    notAuthorized: "Account not authorized",
    notAuthorizedSuffix:
      "is signed in, but there is no administrator document for this account.",
    manualAction: "MANUAL ACTION REQUIRED",
    stepOpen: "Open Firebase Console → Firestore Database.",
    stepCreatePrefix: "Create or open the",
    stepCreateCollection: "admins",
    stepCreateSuffix: "collection.",
    stepIdPrefix: "Add a document whose ID is exactly",
    stepEmailPrefix: "Add an",
    stepEmailField: "email",
    stepEmailSuffix: "field containing",
    seedPrefix: "Or run",
    seedMiddle: "with a service account. The published",
    seedSuffix: "then allow this account into the console.",
    connectionProblem: "Connection problem",
    cannotVerify: "Could not verify access",
    checkItems: "Check these Firebase Console items, then retry:",
    firestoreDatabase: "Firestore Database",
    firestoreDbSuffix: "is created for the project.",
    rules: "firestore.rules",
    rulesSuffix: "is published.",
    accountDocPrefix: "Your account has an",
    accountDocSuffix: "document.",
  },
  login: {
    backAria: "Back to COOMIAC PROJET",
    setupRequired: "Setup required",
    connectFirebase: "Connect Firebase",
    setupPrefix: "The admin console is ready. Add the Firebase project keys to",
    setupOr: "(or",
    setupSuffix: "), restart the dev server, then reload this page.",
    copyPrefix: "Copy",
    copyTo: "to",
    copySuffix:
      "and paste the values from your Firebase console (Project settings → Your apps).",
    protectedArea: "Protected area",
    signIn: "Admin sign in",
    signInBody: "Sign in with your COOMIAC PROJET administrator account.",
    emailPlaceholder: "coomiac@admin.com",
    passwordPlaceholder: "Your password",
    signingIn: "Signing in…",
    signInButton: "Sign in",
    restrictedNote: "Access is restricted to authorized COOMIAC PROJET staff ONLY.",
  },
  overview: {
    inquiryTypes: {
      general: "General partnership",
      quote: "Product quote",
      compliance: "Compliance & documents",
    },
    stats: {
      products: "Products",
      productsHint: "Published on the minerals page",
      gallery: "Gallery photos",
      galleryHint: "Visible in the public gallery",
      messages: "Messages",
      messagesHint: "Received through the contact form",
    },
    contactUpdated: "Contact details updated. The public website now uses them.",
    checklistTitle: "Firebase setup checklist",
    checklistDbPrefix: "is created for the",
    checklistRulesPrefix: "The latest",
    checklistRulesSuffix: "is published.",
    checklistStoragePrefix: "Storage",
    checklistStorageSuffix: "is started and",
    checklistStorageRules: "storage.rules",
    checklistStorageRulesSuffix: "is published.",
    checklistAdminPrefix: "Your signed-in account has an",
    checklistAdminSuffix: "document.",
    checklistAfter:
      "After changing anything in Firebase Console, refresh this page or sign out and back in.",
    contact: {
      title: "Contact details",
      description: "These values power the contact page, the footer and the WhatsApp button.",
      email: "Email",
      phone: "Phone",
      whatsapp: "WhatsApp number",
      whatsappHint: "Digits only, including the country code (no + or spaces).",
      addressEn: "Address (EN)",
      addressFr: "Address (FR)",
      save: "Save contact details",
    },
    latest: {
      title: "Latest messages",
      description: "The most recent inquiries submitted through the public contact form.",
      loading: "Loading messages…",
      empty: "No messages yet. New inquiries will appear here.",
    },
  },
  products: {
    title: "Products",
    editTitle: "Edit product",
    newTitle: "New product",
    autoTranslateHint: "French fields left empty are translated from English automatically when you save.",
    titleEn: "Title (English) *",
    titleFr: "Title (French)",
    titleFrPlaceholder: "Coltan (auto)",
    specEn: "Specification (English)",
    specFr: "Specification (French)",
    descriptionEn: "Description (English)",
    descriptionFr: "Description (French)",
    descriptionEnPlaceholder:
      "Describe the mineral, its origin, preparation and the lots available.",
    descriptionFrPlaceholder: "Description en français (traduction automatique si vide)",
    category: "Category",
    categoryPlaceholder: "Critical minerals, Base metals, Precious metals",
    categoryHint: "Used by the public filters, in both languages.",
    image: "Product image",
    imageHint: "JPG, PNG or WebP, up to 6 MB. Uploaded to Firebase Storage.",
    imageUrl: "Or image URL",
    imageUrlPlaceholder: "https://…",
    previewAlt: "Product preview",
    newImage: "New image selected",
    currentImage: "Current image",
    saveChanges: "Save changes",
    publish: "Publish product",
    add: "Add product",
    count: (count: number) =>
      count === 1 ? "1 product published" : `${count} products published`,
    loading: "Loading products…",
    empty: "No products yet. Add your first product or seed the demo catalogue to get started.",
    untitled: "Untitled product",
    noCategory: "No category",
    noFrenchTitle: "No French title",
    busyTranslating: "Translating…",
    busySaving: "Saving…",
    busyUploading: "Uploading image…",
    busyTranslatingTitle: "Translating title…",
    busyTranslatingDescription: "Translating description…",
    busyDeleting: "Deleting…",
    errEnglishFirst: "Add the English text first, then translate.",
    cachedFrench: "Loaded the French text from the translation cache.",
    translatedReview: "French text translated. Review it before saving.",
    errEnglishTitle: "An English product title is required.",
    savedWithoutTitle: (detail: string) => `Saved without the French title (${detail}).`,
    savedWithoutDescription: (detail: string) =>
      `Saved without the French description (${detail}).`,
    savedUpdated: "Product updated. The public site now shows the new content.",
    savedPublished: "Product published. It is now live on the public site.",
    deleteConfirm: (title: string) => `Delete “${title}”? This cannot be undone.`,
    deleted: "Product deleted.",
  },
  gallery: {
    title: "Photo gallery",
    description: "Upload multiple photos, edit bilingual captions, and drag the handle to reorder.",
    upload: "Upload photos",
    busyUploading: (count: number) =>
      `Uploading ${count} image${count === 1 ? "" : "s"}…`,
    loading: "Loading gallery…",
    empty: "No photos yet. Upload your first images to build the public gallery.",
    dragToReorder: "Drag to reorder",
    captionEn: "Caption (EN)",
    captionFr: "Caption (FR)",
    captionEnPlaceholder: "Gold doré prepared for export",
    captionFrPlaceholder: "Légende en français",
    saveCaption: "Save caption",
    refresh: "Refresh gallery",
    busySavingCaption: "Saving caption…",
    busyTranslating: "Translating…",
    busyDeleting: "Deleting…",
    confirmDelete: "Delete this photo from the gallery? This cannot be undone.",
    savedCaption: "Caption saved.",
    errEnglishFirst: "Write the English caption first, then translate.",
    cachedFrench: "French caption loaded from the translation cache. Review it, then save.",
    translatedReview: "French caption translated. Review it, then save.",
    deleted: "Photo deleted.",
    orderSaved: "Gallery order saved.",
    uploaded: (count: number) =>
      `${count} image${count === 1 ? "" : "s"} added. Add captions and drag to reorder.`,
    builtInTitle: "Built-in photos & source links",
    builtInBody:
      "These real photographs ship with the site as local files. To swap one, replace the file shown below (keep the same name), or drop a JPG/PNG into photos-to-add/ and run npm run photos:optimize. Photos uploaded above always take priority over these demo images.",
  },
  inbox: {
    inquiryTypes: {
      general: "Partnership",
      quote: "Quote request",
      compliance: "Compliance",
    },
    defaultSubject: "Re: Your inquiry — COOMIAC PROJET",
    subjectForCompany: (company: string) => `Re: ${company} — COOMIAC PROJET`,
    replyTemplate: (firstName: string) =>
      [
        `Dear ${firstName || "there"},`,
        "",
        "Thank you for contacting COOMIAC PROJET. We have received your inquiry and are reviewing it with our team.",
        "",
        "We will follow up shortly with availability, assay details and commercial terms for the mineral you requested.",
        "",
        "Best regards,",
        "COOMIAC PROJET",
        "Walikale · North Kivu · DR Congo",
        "coomiaec@gmail.com",
      ].join("\n"),
    title: "Messages",
    received: (count: number) => `${count} received`,
    filterAll: "All",
    filterAwaiting: "Awaiting reply",
    filterReplied: "Replied",
    searchPlaceholder: "Search name, company or email",
    searchAria: "Search messages",
    loading: "Loading messages…",
    empty: "No messages yet. Inquiries from the contact form appear here.",
    noMatch: "No messages match this view.",
    sentCount: (count: number) => `${count} sent`,
    notConfiguredBadge: "Email sending not configured",
    notConfiguredTitle: (from: string) => `Set up replies from ${from}`,
    notConfiguredReason:
      "Add the mail credentials on the server to send replies directly from the admin console.",
    notConfiguredMailApp:
      "Until then, use Open in mail app — the message is pre-filled and will be sent from your own mailbox.",
    serverConfig: "Server configuration",
    configIntro: "Add these variables to .env (local) and to your hosting environment:",
    configAppPassword: "a Google app password (not the account password)",
    configAppPasswords:
      "Google app passwords: Google Account → Security → 2-Step Verification → App passwords.",
    configResend: "A RESEND_API_KEY is also supported as an alternative provider.",
    selectMessage: "Select a message to read it and reply.",
    backAll: "← All messages",
    inquiryEyebrow: (label: string) => `Inquiry · ${label}`,
    receivedOn: (date: string) => `Received ${date}`,
    repliesSent: "Replies sent",
    replyFrom: (date: string, from: string) => `${date} · from ${from}`,
    replyTitle: "Reply",
    subject: "Subject",
    message: "Message",
    sendReply: "Send reply",
    openMailApp: "Open in mail app",
    resetText: "Reset text",
    fromHintPrefix: "Replies are sent from",
    fromHintSuffix: "and saved to this conversation.",
    busySending: "Sending…",
    errNoMessage: "Write a reply before sending.",
    errSessionExpired: "Your session has expired. Sign in again.",
    errSend: (status: number) => `The reply could not be sent (${status}).`,
    replySent: (email: string, from: string) => `Reply sent to ${email} from ${from}.`,
    replySavedWarning: (email: string) =>
      `Reply sent to ${email}, but it could not be saved to this conversation. Publish the Firestore rules and refresh.`,
  },
};

const fr: typeof en = {
  language: {
    label: "Langue",
    english: "English",
    french: "Français",
  },
  common: {
    loading: "Chargement…",
    refresh: "Actualiser",
    refreshing: "Actualisation…",
    save: "Enregistrer",
    saving: "Enregistrement…",
    cancel: "Annuler",
    close: "Fermer",
    delete: "Supprimer",
    edit: "Modifier",
    translate: "Traduire",
    signOut: "Se déconnecter",
    backWebsite: "Retour au site",
    viewSite: "Voir le site",
    light: "Clair",
    dark: "Sombre",
    retry: "Réessayer",
    technicalDetails: "Détails techniques",
    signedIn: "Connecté",
    email: "E-mail",
    password: "Mot de passe",
    statusNew: "Nouveau",
    statusReplied: "Répondu",
    statusAwaiting: "En attente de réponse",
    noCompany: "Aucune société",
    unnamed: "Sans nom",
    openMessages: "Ouvrir les messages",
    viewConversation: "Voir la conversation",
    reply: "Répondre",
  },
  nav: {
    overview: "Vue d'ensemble",
    messages: "Messages",
    products: "Produits",
    gallery: "Galerie photo",
    label: "Sections d'administration",
  },
  headings: {
    overview: {
      title: "Vue d'ensemble",
      subtitle: "Votre catalogue, votre galerie et vos messages en un coup d'œil.",
    },
    inbox: {
      title: "Messages",
      subtitle:
        "Lisez chaque demande et répondez directement depuis l'adresse officielle COOMIAC.",
    },
    products: {
      title: "Produits",
      subtitle: "Publiez et traduisez les minéraux présentés sur le site public.",
    },
    gallery: {
      title: "Galerie photo",
      subtitle: "Gérez les photographies affichées dans la galerie publique.",
    },
  },
  shell: {
    backPublic: "Retour au site public",
    workspace: "Espace de travail",
    loadingWorkspace: "Chargement de l'espace…",
    redirecting: "Redirection vers la connexion…",
    checkingAccess: "Vérification de l'accès…",
    toggleDark: "Basculer le mode sombre",
    adminSuffix: "Administration COOMIAC",
  },
  access: {
    restricted: "Zone réservée",
    notAuthorized: "Compte non autorisé",
    notAuthorizedSuffix:
      "est connecté, mais aucun document administrateur n'existe pour ce compte.",
    manualAction: "ACTION MANUELLE REQUISE",
    stepOpen: "Ouvrez Firebase Console → Firestore Database.",
    stepCreatePrefix: "Créez ou ouvrez la collection",
    stepCreateCollection: "admins",
    stepCreateSuffix: ".",
    stepIdPrefix: "Ajoutez un document dont l'ID est exactement",
    stepEmailPrefix: "Ajoutez un champ",
    stepEmailField: "email",
    stepEmailSuffix: "contenant",
    seedPrefix: "Ou exécutez",
    seedMiddle: "avec un compte de service. Les règles publiées dans",
    seedSuffix: "autorisent ensuite ce compte dans la console.",
    connectionProblem: "Problème de connexion",
    cannotVerify: "Impossible de vérifier l'accès",
    checkItems: "Vérifiez ces éléments dans Firebase Console, puis réessayez :",
    firestoreDatabase: "Firestore Database",
    firestoreDbSuffix: "est créé pour le projet.",
    rules: "firestore.rules",
    rulesSuffix: "est publié.",
    accountDocPrefix: "Votre compte possède un document",
    accountDocSuffix: ".",
  },
  login: {
    backAria: "Retour à COOMIAC PROJET",
    setupRequired: "Configuration requise",
    connectFirebase: "Connecter Firebase",
    setupPrefix: "La console d'administration est prête. Ajoutez les clés Firebase à",
    setupOr: "(ou",
    setupSuffix: "), redémarrez le serveur de développement, puis rechargez cette page.",
    copyPrefix: "Copiez",
    copyTo: "vers",
    copySuffix:
      "et collez les valeurs de votre console Firebase (Paramètres du projet → Vos applications).",
    protectedArea: "Zone protégée",
    signIn: "Connexion administrateur",
    signInBody: "Connectez-vous avec votre compte administrateur COOMIAC PROJET.",
    emailPlaceholder: "coomiac@admin.com",
    passwordPlaceholder: "Votre mot de passe",
    signingIn: "Connexion…",
    signInButton: "Se connecter",
    restrictedNote:
      "L'accès est strictement réservé au personnel autorisé de COOMIAC PROJET.",
  },
  overview: {
    inquiryTypes: {
      general: "Partenariat général",
      quote: "Demande de devis",
      compliance: "Conformité et documents",
    },
    stats: {
      products: "Produits",
      productsHint: "Publiés sur la page des minéraux",
      gallery: "Photos de la galerie",
      galleryHint: "Visibles dans la galerie publique",
      messages: "Messages",
      messagesHint: "Reçus via le formulaire de contact",
    },
    contactUpdated:
      "Coordonnées mises à jour. Le site public les utilise désormais.",
    checklistTitle: "Liste de vérification Firebase",
    checklistDbPrefix: "est créé pour le projet",
    checklistRulesPrefix: "La dernière version de",
    checklistRulesSuffix: "est publiée.",
    checklistStoragePrefix: "Storage",
    checklistStorageSuffix: "est activé et",
    checklistStorageRules: "storage.rules",
    checklistStorageRulesSuffix: "est publié.",
    checklistAdminPrefix: "Votre compte connecté possède un document",
    checklistAdminSuffix: ".",
    checklistAfter:
      "Après toute modification dans Firebase Console, actualisez cette page ou déconnectez-vous puis reconnectez-vous.",
    contact: {
      title: "Coordonnées",
      description:
        "Ces valeurs alimentent la page de contact, le pied de page et le bouton WhatsApp.",
      email: "E-mail",
      phone: "Téléphone",
      whatsapp: "Numéro WhatsApp",
      whatsappHint:
        "Chiffres uniquement, avec l'indicatif pays (sans + ni espaces).",
      addressEn: "Adresse (EN)",
      addressFr: "Adresse (FR)",
      save: "Enregistrer les coordonnées",
    },
    latest: {
      title: "Derniers messages",
      description:
        "Les demandes les plus récentes envoyées via le formulaire de contact public.",
      loading: "Chargement des messages…",
      empty: "Aucun message pour le moment. Les nouvelles demandes apparaîtront ici.",
    },
  },
  products: {
    title: "Produits",
    editTitle: "Modifier le produit",
    newTitle: "Nouveau produit",
    autoTranslateHint:
      "Les champs français laissés vides sont traduits automatiquement depuis l'anglais lors de l'enregistrement.",
    titleEn: "Titre (anglais) *",
    titleFr: "Titre (français)",
    titleFrPlaceholder: "Coltan (auto)",
    specEn: "Spécification (anglais)",
    specFr: "Spécification (français)",
    descriptionEn: "Description (anglais)",
    descriptionFr: "Description (français)",
    descriptionEnPlaceholder:
      "Décrivez le minéral, son origine, sa préparation et les lots disponibles.",
    descriptionFrPlaceholder: "Description en français (traduction automatique si vide)",
    category: "Catégorie",
    categoryPlaceholder: "Minéraux critiques, Métaux de base, Métaux précieux",
    categoryHint: "Utilisée par les filtres publics, dans les deux langues.",
    image: "Image du produit",
    imageHint: "JPG, PNG ou WebP, jusqu'à 6 Mo. Envoyée vers Firebase Storage.",
    imageUrl: "Ou URL de l'image",
    imageUrlPlaceholder: "https://…",
    previewAlt: "Aperçu du produit",
    newImage: "Nouvelle image sélectionnée",
    currentImage: "Image actuelle",
    saveChanges: "Enregistrer les modifications",
    publish: "Publier le produit",
    add: "Ajouter un produit",
    count: (count: number) =>
      count === 1 ? "1 produit publié" : `${count} produits publiés`,
    loading: "Chargement des produits…",
    empty:
      "Aucun produit pour le moment. Ajoutez votre premier produit ou initialisez le catalogue de démonstration.",
    untitled: "Produit sans titre",
    noCategory: "Sans catégorie",
    noFrenchTitle: "Sans titre français",
    busyTranslating: "Traduction…",
    busySaving: "Enregistrement…",
    busyUploading: "Envoi de l'image…",
    busyTranslatingTitle: "Traduction du titre…",
    busyTranslatingDescription: "Traduction de la description…",
    busyDeleting: "Suppression…",
    errEnglishFirst: "Ajoutez d'abord le texte anglais, puis traduisez.",
    cachedFrench: "Texte français chargé depuis le cache de traduction.",
    translatedReview: "Texte français traduit. Vérifiez-le avant d'enregistrer.",
    errEnglishTitle: "Un titre de produit en anglais est obligatoire.",
    savedWithoutTitle: (detail: string) =>
      `Enregistré sans le titre français (${detail}).`,
    savedWithoutDescription: (detail: string) =>
      `Enregistré sans la description française (${detail}).`,
    savedUpdated:
      "Produit mis à jour. Le site public affiche désormais le nouveau contenu.",
    savedPublished: "Produit publié. Il est maintenant en ligne sur le site public.",
    deleteConfirm: (title: string) =>
      `Supprimer « ${title} » ? Cette action est irréversible.`,
    deleted: "Produit supprimé.",
  },
  gallery: {
    title: "Galerie photo",
    description:
      "Envoyez plusieurs photos, modifiez les légendes bilingues et faites glisser la poignée pour réorganiser.",
    upload: "Envoyer des photos",
    busyUploading: (count: number) =>
      `Envoi de ${count} image${count === 1 ? "" : "s"}…`,
    loading: "Chargement de la galerie…",
    empty:
      "Aucune photo pour le moment. Envoyez vos premières images pour créer la galerie publique.",
    dragToReorder: "Faire glisser pour réorganiser",
    captionEn: "Légende (EN)",
    captionFr: "Légende (FR)",
    captionEnPlaceholder: "Or doré préparé pour l'exportation",
    captionFrPlaceholder: "Légende en français",
    saveCaption: "Enregistrer la légende",
    refresh: "Actualiser la galerie",
    busySavingCaption: "Enregistrement de la légende…",
    busyTranslating: "Traduction…",
    busyDeleting: "Suppression…",
    confirmDelete: "Supprimer cette photo de la galerie ? Cette action est irréversible.",
    savedCaption: "Légende enregistrée.",
    errEnglishFirst: "Rédigez d'abord la légende anglaise, puis traduisez.",
    cachedFrench:
      "Légende française chargée depuis le cache de traduction. Vérifiez-la, puis enregistrez.",
    translatedReview:
      "Légende française traduite. Vérifiez-la, puis enregistrez.",
    deleted: "Photo supprimée.",
    orderSaved: "Ordre de la galerie enregistré.",
    uploaded: (count: number) =>
      `${count} image${count === 1 ? "" : "s"} ajoutée${count === 1 ? "" : "s"}. Ajoutez des légendes et réorganisez par glisser-déposer.`,
    builtInTitle: "Photos intégrées et liens sources",
    builtInBody:
      "Ces photographies réelles sont livrées avec le site sous forme de fichiers locaux. Pour en remplacer une, remplacez le fichier indiqué ci-dessous (en conservant le même nom), ou déposez un JPG/PNG dans photos-to-add/ puis exécutez npm run photos:optimize. Les photos envoyées ci-dessus restent prioritaires sur ces images de démonstration.",
  },
  inbox: {
    inquiryTypes: {
      general: "Partenariat",
      quote: "Demande de devis",
      compliance: "Conformité",
    },
    defaultSubject: "Re : Votre demande — COOMIAC PROJET",
    subjectForCompany: (company: string) => `Re : ${company} — COOMIAC PROJET`,
    replyTemplate: (firstName: string) =>
      [
        `${firstName ? `Bonjour ${firstName},` : "Bonjour,"}`,
        "",
        "Merci d'avoir contacté COOMIAC PROJET. Nous avons bien reçu votre demande et notre équipe l'examine actuellement.",
        "",
        "Nous reviendrons vers vous rapidement avec les disponibilités, les détails d'analyse et les conditions commerciales du minéral demandé.",
        "",
        "Cordialement,",
        "COOMIAC PROJET",
        "Walikale · Nord-Kivu · RD Congo",
        "coomiaec@gmail.com",
      ].join("\n"),
    title: "Messages",
    received: (count: number) => `${count} reçu${count === 1 ? "" : "s"}`,
    filterAll: "Tous",
    filterAwaiting: "En attente",
    filterReplied: "Répondus",
    searchPlaceholder: "Rechercher un nom, une société ou un e-mail",
    searchAria: "Rechercher dans les messages",
    loading: "Chargement des messages…",
    empty:
      "Aucun message pour le moment. Les demandes du formulaire de contact apparaîtront ici.",
    noMatch: "Aucun message ne correspond à cette vue.",
    sentCount: (count: number) => `${count} envoyé${count === 1 ? "" : "s"}`,
    notConfiguredBadge: "Envoi d'e-mails non configuré",
    notConfiguredTitle: (from: string) => `Configurer les réponses depuis ${from}`,
    notConfiguredReason:
      "Ajoutez les identifiants de messagerie sur le serveur pour répondre directement depuis la console d'administration.",
    notConfiguredMailApp:
      "En attendant, utilisez « Ouvrir dans l'application de messagerie » : le message est prérempli et sera envoyé depuis votre propre boîte.",
    serverConfig: "Configuration du serveur",
    configIntro:
      "Ajoutez ces variables dans .env (en local) et dans votre environnement d'hébergement :",
    configAppPassword:
      "un mot de passe d'application Google (pas le mot de passe du compte)",
    configAppPasswords:
      "Mots de passe d'application Google : Compte Google → Sécurité → Validation en deux étapes → Mots de passe des applications.",
    configResend:
      "Une RESEND_API_KEY est également prise en charge comme fournisseur alternatif.",
    selectMessage: "Sélectionnez un message pour le lire et y répondre.",
    backAll: "← Tous les messages",
    inquiryEyebrow: (label: string) => `Demande · ${label}`,
    receivedOn: (date: string) => `Reçu le ${date}`,
    repliesSent: "Réponses envoyées",
    replyFrom: (date: string, from: string) => `${date} · de ${from}`,
    replyTitle: "Répondre",
    subject: "Objet",
    message: "Message",
    sendReply: "Envoyer la réponse",
    openMailApp: "Ouvrir dans l'application de messagerie",
    resetText: "Réinitialiser le texte",
    fromHintPrefix: "Les réponses sont envoyées depuis",
    fromHintSuffix: "et enregistrées dans cette conversation.",
    busySending: "Envoi…",
    errNoMessage: "Rédigez une réponse avant de l'envoyer.",
    errSessionExpired: "Votre session a expiré. Reconnectez-vous.",
    errSend: (status: number) =>
      `La réponse n'a pas pu être envoyée (${status}).`,
    replySent: (email: string, from: string) =>
      `Réponse envoyée à ${email} depuis ${from}.`,
    replySavedWarning: (email: string) =>
      `Réponse envoyée à ${email}, mais elle n'a pas pu être enregistrée dans cette conversation. Publiez les règles Firestore et actualisez.`,
  },
};

export const adminCopy = { en, fr };

export type AdminCopy = typeof en;

type AdminI18nValue = {
  lang: AdminLang;
  setLang: (lang: AdminLang) => void;
  t: AdminCopy;
};

const AdminI18nContext = createContext<AdminI18nValue | null>(null);

function readAdminLang(): AdminLang {
  try {
    const stored = localStorage.getItem("lang");
    if (stored === "fr" || stored === "en") return stored;
  } catch {
    /* storage can be unavailable in private/embedded contexts */
  }
  const browser = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  return browser.startsWith("fr") ? "fr" : "en";
}

export function AdminLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>(readAdminLang);

  const setLang = (next: AdminLang) => {
    setLangState(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      /* the choice still applies for this visit */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <AdminI18nContext.Provider value={{ lang, setLang, t: adminCopy[lang] }}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n(): AdminI18nValue {
  const value = useContext(AdminI18nContext);
  if (!value) throw new Error("useAdminI18n must be used inside AdminLangProvider.");
  return value;
}

export function AdminLangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useAdminI18n();
  return (
    <div className={`admin-lang-toggle ${className}`.trim()} role="group" aria-label={t.language.label}>
      <button
        type="button"
        className={lang === "en" ? "active" : ""}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        title={t.language.english}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === "fr" ? "active" : ""}
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        title={t.language.french}
      >
        FR
      </button>
    </div>
  );
}

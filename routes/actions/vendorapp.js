

const dataModel = {
      headers: [
        { text: 'First Name', value:'firstName', sortable: true },
        { text: 'Last Name', value:'lastName', sortable: true },
        { text: 'Address', value:'address', sortable: true }
      ],
      items: [
        {firstName:'Big', lastName: 'Bork', address: '1234 Bork Street, Bob City, CA 99999'},

      ],
      formData: {
        firstName: '',
        lastName: '',
        textField3: '',
        textField4: ''
      },
      tab: 0,
      tabItems: ['tab1', 'tab2', 'tab3']
    };
const uiMethods = {
      initialize: {
        args:[],
        body: `
        this._appGet('formData', function(ui, data) {
          ui.items = data;
          ui.formData.textField3 = '2222222222222';
          ui.formData.textField4 = '4444444444444';
          ui.getUserData();
        })`
      },
      submitForm: {
        args:[],
        body: `this._appPost('submitform', this.formData, function(ui, data) {
          console.log(data.success);
        });`
      },
    };
const components = {
  TableRow: {
    component: 'tr',
    on: {click: "this.clickEvent"},
    contents: [
      {
        component: 'td',
        template: '<span>{{item.firstName}}</span>'
      },
      {
        component: 'td',
        template: '<span>{{item.lastName}}</span>'
      },
      {
        component: 'td',
        template: '<span>{{item.address}}</span>'
      }
    ]
  }
}

const uiConfig = {
  requiredUserData: ['firstName', 'lastName'],
  dataModel:dataModel,
  uiMethods: uiMethods,
  uiSchema: {
    component: 'container',
    contents: [
      {
        component: 'card',
        props: {
          elevation: 2
        },
        contents: [{
          component: 'cardTitle',
//              contents: 'This is the title'
          template: '<span>Welcome {{ch_userData.firstName}} {{ch_userData.lastName}}</span>'
        },
        {
          component: 'cardBody',
          contents: [
            {
              component: 'form',
              props: {
                'lazy-validation': true
              },
              contents: [
                {
                  component: 'row',
                  contents: [
                    {
                      component: 'col',
                      props: {  cols:12, md:6, sm:12},
                      contents: [
                        {
                          component: 'textField',
                          vmodel: 'formData.firstName',
                          tokenId: 'firstName',
                          props: {
                            dense: true,
                            outlined: false,
                            label: 'First Name'
                          }},
                          {
                          component: 'textField',
                          vmodel: 'formData.lastName',
                          tokenId: 'lastName',
                          props: {
                            dense: true,
                            outlined: false,
                            label: 'Last Name'
                          }}
                      ]
                    },
                    {
                      component: 'col',
                      props: { cols:12, md:6, sm:12},
                      contents: [
                        {
                          component: 'textField',
                          vmodel: 'formData.textField3',
                          props: {
                            dense: true,
                            outlined: false,
                            label: 'Field 3'
                          }},
                          {
                          component: 'textField',
                          vmodel: 'formData.textField4',
                          props: {
                            dense: true,
                            outlined: false,
                            label: 'Field 4'
                          }}
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          component: 'cardActions',
          contents: [{
            component: 'button',
            contents: 'Cancel'
          },
          {
            component: 'spacer'
          },
          {
            component: 'button',
            on: {
              click: 'this.submitForm'
            },
            contents: 'Save'
          }
          ]
        }]
      },
      {
        component: 'tabs',
        props: {
          'align-with-title': true
        },
        vmodel: "tab",
        contents: [
          {
            component: 'tabsSlider',
            props:{ color: "yellow"}
          },
          {
            component: 'tab',
            template: '<span>{{tabItems[0]}}</span>'
          },
          {
            component: 'tab',
            template: '<span>{{tabItems[1]}}</span>'
          },
          {
            component: 'tab',
            template: '<span>{{tabItems[2]}}</span>'
          }
        ]
      },
      {
        component: 'tabsItems',
        vmodel: "tab",
        contents: [
          {
            component: 'tabItem',
            contents: [
              {
                component: 'dataTable',
                attrs: {
                  uiSchema: components.TableRow,
                  headers: "this.headers",
                  items: "this.items"
                }
              }        
            ]
          },
          {
            component: 'tabItem',
            contents: 'Contents of Tab 2'
          },
          {
            component: 'tabItem',
            contents: 'Contents of Tab 3'
          }
        ]
      },
      {
        component: 'conversation',
        attrs: {
          topic: 'Test Topic'
        }
      }
    ]
  }
};
const uiConfig2 = {
  requiredUserData: ['firstName', 'lastName'],
  dataModel:{},
  uiMethods: {},
  uiSchema: {
    component: 'container',
    contents: [
      {
        component: 'card',
        props: {
          elevation: 2
        },
        contents: [{
          component: 'cardTitle',
          template: '<span>Form submitted for {{ch_userData.firstName}} {{ch_userData.lastName}}</span>'
        },
        {
          component: 'cardBody',
          contents: "More to come..."
        }],
      }
    ]
  }
};


import { Router } from 'express';

export default class VendorApp {
  constructor() {
      this.router = new Router();
  }
  route(){
    this.router.get("/initUIConfig", (req, res) => {
      res.json(uiConfig)
    });
    this.router.get("/formSubmitted", (req, res) => {
      res.json(uiConfig2)
    });
    this.router.get("/formData", (req, res) => {
      res.json([
        {firstName:'Bob', lastName: 'Smith', address: '1234 Bob Street, Bob City, CA 99999'},
        {firstName:'Dave', lastName: 'Anderson', address: '9999 Dave Street, Some City, CA 99999'},
        {firstName:'Xaviar', lastName: 'Gomez', address: '7777 Xav Street, Gomez City, CA 99999'}
      ]);
    });

    this.router.post("/submitform", (req, res) => {
      console.log('Form data:\n'+JSON.stringify(req.body));
      res.json({success:true, newPage:'formSubmitted'})
    });

    return this.router;
  }
}  


const dataModel = {
      cardTitle: 'CloudHaven Example App',
      headers: [
        { text: 'First Name', value:'firstName', sortable: true },
        { text: 'Last Name', value:'lastName', sortable: true },
        { text: 'Address', value:'address', sortable: true }
      ],
      items: [
        {firstName:'Big', lastName: 'Bork', address: '1234 Bork Street, Bob City, CA 99999'},

      ],
      formData: {
        textField1: '',
        textField2: '',
        textField3: '',
        textField4: ''
      }
    };
const uiMethods = {
      initialize: {
        args:[],
        body: `
        this._appGet('formData', function(ui, data) {
          ui.items = data;
          ui.getUserData();
        })`
      },
      submitForm: {
        args:[],
        body: `this._appPost('submitform', this.formData, function(ui, data) { alert('result: '+data.success);});`
      },
    };

const uiConfig = {
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
              template: '<span>{{cardTitle}}</span>'
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
                              vmodel: 'formData.textField1',
                              tokenId: 'textField1',
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 1'
                              }},
                              {
                              component: 'textField',
                              vmodel: 'formData.textField2',
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 2'
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
                              tokenId: 'textField3',
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
            component: 'dataTable',
            attrs: {
              headers: "this.headers",
              items: "this.items"
            }
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
    this.router.get("/formData", (req, res) => {
      res.json([
        {firstName:'Bob', lastName: 'Smith', address: '1234 Bob Street, Bob City, CA 99999'},
        {firstName:'Dave', lastName: 'Anderson', address: '9999 Dave Street, Some City, CA 99999'},
        {firstName:'Xaviar', lastName: 'Gomez', address: '7777 Xav Street, Gomez City, CA 99999'}
      ]);
    });

    this.router.post("/submitform", (req, res) => {
      console.log('Form data:\n'+JSON.stringify(req.body));
      res.json({success:true})
    });

    return this.router;
  }
}  
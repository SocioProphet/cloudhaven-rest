

const dataModel = {
      cardTitle: 'Card Title...',
      headers: [
        { text: 'First Name', value:'firstName', sortable: true },
        { text: 'Last Name', value:'lastName', sortable: true },
        { text: 'Address', value:'address', sortable: true }
      ],
      items: [
        {firstName:'Big', lastName: 'Bork', address: '1234 Bork Street, Bob City, CA 99999'},

      ]
    };
const uiMethods = {
      initialize: {
        args:[],
        body: `
        this.items = [
          {firstName:'Bob', lastName: 'Smith', address: '1234 Bob Street, Bob City, CA 99999'},
          {firstName:'Dave', lastName: 'Anderson', address: '9999 Dave Street, Some City, CA 99999'},
          {firstName:'Xaviar', lastName: 'Gomez', address: '7777 Xav Street, Gomez City, CA 99999'}
        ];`
      },
      submitForm: {
        args:[],
        body: `
          this._appPost('submitForm', this.formData);
        ];`
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
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 1'
                              }},
                              {
                              component: 'textField',
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
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 3'
                              }},
                              {
                              component: 'textField',
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
    this.router.get("/", (req, res) => {
      res.json(uiConfig)
    });
    return this.router;
  }
}  
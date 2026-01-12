
import { KnowledgeBase } from '../types';

export const knowledgeBase: KnowledgeBase = {
  symptoms: [
    { id: 'S1', name: 'High Fever', category: 'General' },
    { id: 'S2', name: 'Persistent Cough', category: 'Respiratory' },
    { id: 'S3', name: 'Shortness of Breath', category: 'Respiratory' },
    { id: 'S4', name: 'Fatigue', category: 'General' },
    { id: 'S5', name: 'Loss of Taste/Smell', category: 'Neurological' },
    { id: 'S6', name: 'Body Aches', category: 'General' },
    { id: 'S7', name: 'Sore Throat', category: 'Respiratory' },
    { id: 'S8', name: 'Runny Nose', category: 'Respiratory' },
    { id: 'S9', name: 'Chest Pain', category: 'Cardiovascular' },
    { id: 'S10', name: 'Skin Rash', category: 'Dermatological' },
    { id: 'S11', name: 'Itchy Eyes', category: 'Allergy' },
    { id: 'S12', name: 'Sneezing', category: 'Allergy' },
    { id: 'S13', name: 'Headache', category: 'General' },
    { id: 'S14', name: 'Rapid Heart Rate', category: 'Cardiovascular' },
  ],
  diseases: [
    { id: 'D1', name: 'Common Cold', severity: 'low', description: 'A viral infection of your nose and throat.' },
    { id: 'D2', name: 'Influenza (Flu)', severity: 'medium', description: 'A common viral infection that can be deadly, especially in high-risk groups.' },
    { id: 'D3', name: 'COVID-19', severity: 'high', description: 'An infectious disease caused by the SARS-CoV-2 virus.' },
    { id: 'D4', name: 'Allergic Rhinitis', severity: 'low', description: 'Inflammation in the nose which occurs when the immune system overreacts to allergens.' },
    { id: 'D5', name: 'Pneumonia', severity: 'high', description: 'Infection that inflames air sacs in one or both lungs, which may fill with fluid.' },
  ],
  rules: [
    {
      id: 'R1',
      conclusion: 'D1',
      requirements: ['S8', 'S12'],
      optional: ['S7', 'S13'],
      exclusions: ['S1', 'S9'],
      description: 'Common Cold diagnosis requires runny nose and sneezing without high fever.'
    },
    {
      id: 'R2',
      conclusion: 'D2',
      requirements: ['S1', 'S6', 'S4'],
      optional: ['S2', 'S13'],
      exclusions: ['S11'],
      description: 'Influenza is likely if fever, aches, and fatigue are present.'
    },
    {
      id: 'R3',
      conclusion: 'D3',
      requirements: ['S1', 'S2', 'S5'],
      optional: ['S3', 'S4'],
      exclusions: ['S12'],
      description: 'COVID-19 profile: Fever, cough, and characteristic loss of taste/smell.'
    },
    {
      id: 'R4',
      conclusion: 'D4',
      requirements: ['S11', 'S12', 'S8'],
      optional: ['S7'],
      exclusions: ['S1'],
      description: 'Allergies characterized by itchy eyes and sneezing, but no fever.'
    },
    {
      id: 'R5',
      conclusion: 'D5',
      requirements: ['S1', 'S2', 'S3', 'S9'],
      optional: ['S4'],
      exclusions: [],
      description: 'Pneumonia is critical, involving chest pain and significant respiratory distress.'
    }
  ]
};

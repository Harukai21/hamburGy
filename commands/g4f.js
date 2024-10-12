const { G4F } = require("g4f");
const fs = require("fs");

const g4f = new G4F();

module.exports = {
  name: 'g4f-image',
  description: 'Generate AI art using the G4F active providers.',
  usage: '/g4f <prompt>:<provider number>:<optional model>',
  author: 'Your Name',

  async getAvailableProviders() {
    // Define the list of ACTIVE providers with their description and status
    return [
      { name: 'Emi', description: 'Whimsical cartoon style.', status: 'Active' },
      { name: 'Dalle', description: 'Realistic, intricate details.', status: 'Active' },
      { name: 'DalleMini', description: 'Abstract, vibrant colors.', status: 'Active' },
      { name: 'Prodia', description: 'Photorealistic, detailed and lifelike.', status: 'Active' },
      { name: 'StableDiffusionLite', description: 'Folk art, naive style.', status: 'Active' },
      { name: 'StableDiffusionPlus', description: 'Impressionism, visible brushstrokes.', status: 'Active' }
    ];
  },

  async getAvailableModels(provider) {
    // Define available models per ACTIVE provider
    const models = {
      Prodia: 'ICantBelieveItsNotPhotography_seco.safetensors [4e7a3dfd]',
      StableDiffusionLite: 'folk-art',
      StableDiffusionPlus: 'impressionism'
    };
    return models[provider] || null; // Return the model based on the provider
  },

  getRandomProviderAndModel() {
    const providers = [
      { name: 'Emi', description: 'Whimsical cartoon style.' },
      { name: 'Dalle', description: 'Realistic, intricate details.' },
      { name: 'DalleMini', description: 'Abstract, vibrant colors.' },
      { name: 'Prodia', description: 'Photorealistic, detailed and lifelike.', model: 'ICantBelieveItsNotPhotography_seco.safetensors [4e7a3dfd]' },
      { name: 'StableDiffusionLite', description: 'Folk art, naive style.', model: 'folk-art' },
      { name: 'StableDiffusionPlus', description: 'Impressionism, visible brushstrokes.', model: 'impressionism' }
    ];

    const randomProvider = providers[Math.floor(Math.random() * providers.length)];
    return { provider: randomProvider.name, model: randomProvider.model || null };
  },

  async generateImage(prompt, provider, model, options = {}) {
    try {
      // Generate the image using the G4F package
      const base64Image = await g4f.imageGeneration(prompt, {
        debug: true,
        provider: g4f.providers[provider],
        providerOptions: { ...options, model } // Use providerOptions with model and other options
      });

      // Save the generated image to a file
      fs.writeFile('generated_image.jpg', base64Image, { encoding: 'base64' }, function(err) {
        if (err) {
          console.error('Error saving the image:', err);
        } else {
          console.log('Image saved successfully as generated_image.jpg.');
        }
      });

      return 'Image generated successfully.';
    } catch (error) {
      console.error('Error generating image:', error.message);
      return 'Error generating image. Please try again later.';
    }
  },

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userInput = args.join(' ');
    let [prompt, providerIndex, customModel] = userInput.split(':');
    prompt = prompt ? prompt.trim() : null;

    if (!prompt) {
      return sendMessage(senderId, {
        text: 'Please provide a prompt. Example: /g4f A beautiful landscape:0',
      }, pageAccessToken);
    }

    let selectedProvider, model;

    if (!providerIndex) {
      // Randomly select a provider and model if only the prompt is provided
      const { provider, model: randomModel } = this.getRandomProviderAndModel();
      selectedProvider = provider;
      model = randomModel;
    } else {
      const providers = await this.getAvailableProviders();
      if (providerIndex && !isNaN(parseInt(providerIndex)) && parseInt(providerIndex) >= 0 && parseInt(providerIndex) < providers.length) {
        selectedProvider = providers[parseInt(providerIndex)].name;
      } else {
        selectedProvider = 'Emi'; // Default to Emi provider if invalid providerIndex is specified
      }
      model = customModel || await this.getAvailableModels(selectedProvider);
    }

    // Define options dynamically based on the provider and the documentation provided
    const options = {
      height: selectedProvider === 'Prodia' ? 1024 : 512, // Example based on Prodia
      width: selectedProvider === 'Prodia' ? 1024 : 512,
      samplingSteps: selectedProvider === 'Prodia' ? 20 : 15,
      cfgScale: selectedProvider === 'Prodia' ? 30 : 7
    };

    // Send a message informing the user that the image is being generated
    await sendMessage(senderId, {
      text: `Generating an image using provider: ${selectedProvider} and model: ${model || 'default'}. Please wait...`
    }, pageAccessToken);

    // Generate the image using the selected provider, model, and options
    const result = await this.generateImage(prompt, selectedProvider, model, options);

    // Send the result to the user
    await sendMessage(senderId, { text: result }, pageAccessToken);
  }
};

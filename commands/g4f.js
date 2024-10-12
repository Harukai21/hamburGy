const { G4F } = require("g4f");
const fs = require("fs");

const g4f = new G4F();

module.exports = {
  name: 'g4f-image',
  description: 'Generate AI art using the G4F active providers.',
  usage: '/g4f <prompt>:<provider number>:<optional model>',
  author: 'Your Name',

  async getAvailableProviders() {
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
    const models = {
      Prodia: 'ICantBelieveItsNotPhotography_seco.safetensors [4e7a3dfd]',
      StableDiffusionLite: null, // No model for this provider
      StableDiffusionPlus: 'impressionism'
    };
    return models[provider] || null;
  },

  getProviderOptions(provider) {
    // Return specific provider options based on which provider is selected
    switch (provider) {
      case 'Prodia':
        return {
          height: 1024,
          width: 1024,
          samplingSteps: 20,
          cfgScale: 30
        };
      case 'StableDiffusionLite':
        return {}; // StableDiffusionLite doesn't support additional options
      case 'StableDiffusionPlus':
        return {
          saGuidanceScale: 9
        };
      default:
        return {};
    }
  },

  getRandomProviderAndModel() {
    const providers = [
      { name: 'Emi', description: 'Whimsical cartoon style.' },
      { name: 'Dalle', description: 'Realistic, intricate details.' },
      { name: 'DalleMini', description: 'Abstract, vibrant colors.' },
      { name: 'Prodia', description: 'Photorealistic, detailed and lifelike.', model: 'ICantBelieveItsNotPhotography_seco.safetensors [4e7a3dfd]' },
      { name: 'StableDiffusionLite', description: 'Folk art, naive style.' },
      { name: 'StableDiffusionPlus', description: 'Impressionism, visible brushstrokes.', model: 'impressionism' }
    ];

    const randomProvider = providers[Math.floor(Math.random() * providers.length)];
    return { provider: randomProvider.name, model: randomProvider.model || null };
  },

  async generateImage(prompt, provider, model, options = {}) {
    try {
      const providerOptions = this.getProviderOptions(provider); // Get specific provider options
      const base64Image = await g4f.imageGeneration(prompt, {
        debug: true,
        provider: g4f.providers[provider],
        providerOptions: { ...providerOptions, model } // Merge providerOptions with the selected model
      });

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

    // Inform the user about the image generation process
    await sendMessage(senderId, {
      text: `Generating an image using provider: ${selectedProvider} and model: ${model || 'default'}. Please wait...`
    }, pageAccessToken);

    // Generate the image
    const result = await this.generateImage(prompt, selectedProvider, model);

    // Send the result to the user
    await sendMessage(senderId, { text: result }, pageAccessToken);
  }
};

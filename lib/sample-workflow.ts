import { Node, Edge } from "reactflow";

export const SAMPLE_WORKFLOW_NAME = "Trial Task Workflow";

export const SAMPLE_NODES: Node[] = [
  {
    id: "request-inputs-1",
    type: "requestInputs",
    position: { x: 80, y: 280 },
    data: {
      label: "Request Inputs",
      fields: [
        {
          id: "text_field",
          type: "text_field",
          name: "text_field",
          value:
            "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
        },
        {
          id: "image_field",
          type: "image_field",
          name: "image_field",
          value: null,
        },
      ],
    },
    deletable: false,
  },
  {
    id: "crop-image-1",
    type: "cropImage",
    position: { x: 380, y: 340 },
    data: {
      label: "Crop Image #1",
      inputs: { x: 20, y: 20, width: 60, height: 60 },
      connectedInputs: {},
      output: null,
      status: "idle",
    },
  },
  {
    id: "crop-image-2",
    type: "cropImage",
    position: { x: 380, y: 560 },
    data: {
      label: "Crop Image #2",
      inputs: { x: 0, y: 0, width: 100, height: 50 },
      connectedInputs: {},
      output: null,
      status: "idle",
    },
  },
  {
    id: "gemini-1",
    type: "geminiNode",
    position: { x: 380, y: 80 },
    data: {
      label: "Gemini 3.1 Pro #1",
      model: "gemini-3.1-pro",
      systemPrompt:
        "You are a marketing copywriter. Write a one-paragraph product description.",
      prompt: "",
      connectedInputs: { prompt: "request-inputs-1__text_field" },
      output: null,
      status: "idle",
    },
  },
  {
    id: "gemini-2",
    type: "geminiNode",
    position: { x: 700, y: 80 },
    data: {
      label: "Gemini 3.1 Pro #2",
      model: "gemini-3.1-pro",
      systemPrompt:
        "Condense the following product description into a tweet-length hook (under 240 characters).",
      prompt: "",
      connectedInputs: { prompt: "gemini-1__response" },
      output: null,
      status: "idle",
    },
  },
  {
    id: "gemini-3",
    type: "geminiNode",
    position: { x: 700, y: 280 },
    data: {
      label: "Gemini 1.5 Pro #3 (Final)",
      model: "gemini-1.5-pro",
      systemPrompt:
        "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
      prompt: "",
      connectedInputs: {
        prompt: "gemini-2__response",
        vision: ["crop-image-1__output_image", "crop-image-2__output_image"],
      },
      output: null,
      status: "idle",
    },
  },
  {
    id: "response-1",
    type: "responseNode",
    position: { x: 1020, y: 280 },
    data: {
      label: "Response",
      result: null,
      connectedInputs: { result: "gemini-3__response" },
    },
    deletable: false,
  },
];

export const SAMPLE_EDGES: Edge[] = [
  // Request-Inputs.image_field → Crop #1 + Crop #2
  {
    id: "e-ri-image-crop1",
    source: "request-inputs-1",
    sourceHandle: "image_field",
    target: "crop-image-1",
    targetHandle: "input_image",
    type: "animatedEdge",
    animated: true,
  },
  {
    id: "e-ri-image-crop2",
    source: "request-inputs-1",
    sourceHandle: "image_field",
    target: "crop-image-2",
    targetHandle: "input_image",
    type: "animatedEdge",
    animated: true,
  },
  // Request-Inputs.text_field → Gemini #1.Prompt
  {
    id: "e-ri-text-g1",
    source: "request-inputs-1",
    sourceHandle: "text_field",
    target: "gemini-1",
    targetHandle: "prompt",
    type: "animatedEdge",
    animated: true,
  },
  // Gemini #1.Response → Gemini #2.Prompt
  {
    id: "e-g1-g2",
    source: "gemini-1",
    sourceHandle: "response",
    target: "gemini-2",
    targetHandle: "prompt",
    type: "animatedEdge",
    animated: true,
  },
  // Crop #1 + Crop #2 → Final Gemini.Image (Vision)
  {
    id: "e-crop1-g3",
    source: "crop-image-1",
    sourceHandle: "output_image",
    target: "gemini-3",
    targetHandle: "vision",
    type: "animatedEdge",
    animated: true,
  },
  {
    id: "e-crop2-g3",
    source: "crop-image-2",
    sourceHandle: "output_image",
    target: "gemini-3",
    targetHandle: "vision",
    type: "animatedEdge",
    animated: true,
  },
  // Gemini #2.Response → Final Gemini.Prompt
  {
    id: "e-g2-g3",
    source: "gemini-2",
    sourceHandle: "response",
    target: "gemini-3",
    targetHandle: "prompt",
    type: "animatedEdge",
    animated: true,
  },
  // Final Gemini.Response → Response.result
  {
    id: "e-g3-resp",
    source: "gemini-3",
    sourceHandle: "response",
    target: "response-1",
    targetHandle: "result",
    type: "animatedEdge",
    animated: true,
  },
];

import { pipeline } from '@huggingface/transformers';
import { ClusteringService } from './clusteringService';
import { ChatbotService } from './chatbotService';

export class AIService {
  private static summarizer: any = null;
  private static qaModel: any = null;
  private static classifier: any = null;
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('Initializing AI models...');
      
      // Initialize summarization model
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6', {
        device: 'webgpu',
        dtype: 'fp32'
      });
      
      // Initialize Q&A model
      this.qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad', {
        device: 'webgpu',
        dtype: 'fp32'
      });

      // Initialize text classification for topic detection
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli', {
        device: 'webgpu',
        dtype: 'fp32'
      });
      
      this.initialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU');
      
      // Fallback to CPU
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
      this.qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli');
      
      this.initialized = true;
    }
  }

  static async detectTopic(text: string): Promise<string> {
    await this.initialize();
    
    const academicTopics = [
      'mathematics', 'physics', 'chemistry', 'biology', 'computer science', 
      'programming', 'engineering', 'machine learning', 'data science',
      'algorithms', 'software development', 'web development', 'artificial intelligence',
      'statistics', 'calculus', 'algebra', 'geometry', 'organic chemistry',
      'molecular biology', 'genetics', 'ecology', 'anatomy', 'physiology', 'general'
    ];

    try {
      const result = await this.classifier(text, academicTopics);
      return result.labels[0];
    } catch (error) {
      console.error('Topic detection error:', error);
      return 'general';
    }
  }

  static async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    await this.initialize();
    
    if (text.length < 100) {
      return "Text is too short to summarize effectively. Please provide more content for a meaningful summary.";
    }
    
    try {
      const result = await this.summarizer(text, {
        max_length: maxLength,
        min_length: 50,
        do_sample: false
      });
      
      return result[0].summary_text;
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to summarize text');
    }
  }

  static async answerQuestion(context: string, question: string): Promise<{ answer: string; confidence: number; topic: string }> {
    await this.initialize();
    
    if (!context || !question) {
      throw new Error('Both context and question are required');
    }
    
    try {
      const result = await this.qaModel(question, context);
      const topic = await this.detectTopic(question);
      
      // Track the question for learning analytics
      ClusteringService.addQuestion(question, topic);
      
      return {
        answer: result.answer,
        confidence: Math.round(result.score * 100),
        topic
      };
    } catch (error) {
      console.error('Q&A error:', error);
      throw new Error('Failed to answer question');
    }
  }

  static async generateResponse(message: string, context?: string): Promise<string> {
    console.log('Generating comprehensive academic response for:', message);
    
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if enhanced chatbot is available
    if (ChatbotService.hasApiKey()) {
      try {
        let enhancedPrompt = this.buildEnhancedPrompt(message, context);
        return await ChatbotService.sendMessage(enhancedPrompt);
      } catch (error) {
        console.error('Enhanced chatbot error, falling back to local processing:', error);
      }
    }

    // Enhanced local response generation with comprehensive academic coverage
    try {
      const topic = await this.detectTopic(message);
      ClusteringService.addQuestion(message, topic);

      // Handle specific academic subjects
      if (this.isMathematicsQuestion(message)) {
        return this.handleMathematicsQuestion(message, context);
      }

      if (this.isProgrammingQuestion(message)) {
        return this.handleProgrammingQuestion(message, context);
      }

      if (this.isScienceQuestion(message)) {
        return this.handleScienceQuestion(message, context);
      }

      if (this.isEngineeringQuestion(message)) {
        return this.handleEngineeringQuestion(message, context);
      }

      if (this.isGreeting(message)) {
        return this.getGreetingResponse();
      }

      if (this.isColorQuestion(message)) {
        return this.getColorResponse();
      }

      if (this.isListRequest(message)) {
        return this.generateListResponse(message);
      }

      if (context) {
        if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
          const summary = await this.summarizeText(context);
          return `📚 **AI-Generated Summary**:\n\n${summary}\n\nWould you like me to explain any specific part in more detail?`;
        }
        
        if (message.includes('?')) {
          const result = await this.answerQuestion(context, message);
          return `💡 **Answer**: ${result.answer}\n\n🎯 **Confidence**: ${result.confidence}%\n📖 **Topic**: ${result.topic}\n\nDo you have any follow-up questions?`;
        }

        if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
          const result = await this.answerQuestion(context, message);
          return `🔍 **Explanation**: ${result.answer}\n\n📊 **Confidence**: ${result.confidence}%\n\nFeel free to ask for clarification on any part!`;
        }
      }

      // Generate comprehensive academic responses
      return this.getComprehensiveAcademicResponse(message, topic, context);
      
    } catch (error) {
      console.error('Response generation error:', error);
      return this.getIntelligentFallbackResponse(message);
    }
  }

  private static buildEnhancedPrompt(message: string, context?: string): string {
    let prompt = `You are an expert AI tutor with comprehensive knowledge in all academic subjects including:

**STEM Fields:**
- Mathematics (Algebra, Calculus, Statistics, Geometry, Linear Algebra)
- Physics (Classical, Quantum, Thermodynamics, Electromagnetism)
- Chemistry (Organic, Inorganic, Physical, Analytical)
- Biology (Molecular, Cell, Genetics, Ecology, Anatomy, Physiology)
- Computer Science & Programming (Java, Python, C++, JavaScript, Algorithms, Data Structures)
- Engineering (Mechanical, Electrical, Civil, Software, Chemical)
- Machine Learning & AI (Neural Networks, Deep Learning, Data Science)

**Other Subjects:**
- Economics, Psychology, History, Literature, Philosophy

User Question: ${message}`;

    if (context) {
      prompt += `\n\nRelevant Context:\n${context.substring(0, 1000)}`;
    }

    prompt += `\n\nInstructions:
- Provide accurate, detailed, and educational responses
- Use examples, formulas, and step-by-step explanations when appropriate
- If it's a calculation, show the work
- If it's programming, provide code examples
- If it's science, explain the underlying principles
- Be comprehensive but clear and easy to understand
- If you need clarification, ask specific questions

Response:`;

    return prompt;
  }

  private static isMathematicsQuestion(message: string): boolean {
    const mathTerms = ['calculate', 'solve', 'equation', 'algebra', 'calculus', 'integral', 'derivative', 'matrix', 'probability', 'statistics', 'geometry', 'trigonometry', 'logarithm', 'factorial', 'prime', 'polynomial'];
    return mathTerms.some(term => message.toLowerCase().includes(term)) || /\d+[\+\-\*\/\^\(\)]\d+/.test(message);
  }

  private static isProgrammingQuestion(message: string): boolean {
    const programmingTerms = ['java', 'python', 'javascript', 'c++', 'code', 'programming', 'algorithm', 'function', 'variable', 'loop', 'array', 'class', 'object', 'method', 'syntax', 'debug', 'compile', 'runtime'];
    return programmingTerms.some(term => message.toLowerCase().includes(term));
  }

  private static isScienceQuestion(message: string): boolean {
    const scienceTerms = ['physics', 'chemistry', 'biology', 'molecule', 'atom', 'cell', 'dna', 'protein', 'reaction', 'force', 'energy', 'gravity', 'electron', 'photon'];
    return scienceTerms.some(term => message.toLowerCase().includes(term));
  }

  private static isEngineeringQuestion(message: string): boolean {
    const engineeringTerms = ['engineering', 'design', 'structure', 'circuit', 'mechanical', 'electrical', 'civil', 'software', 'system', 'process'];
    return engineeringTerms.some(term => message.toLowerCase().includes(term));
  }

  private static handleMathematicsQuestion(message: string, context?: string): string {
    return `🔢 **Mathematics Solution**

I can help you with this mathematical problem! Here's my approach:

${this.getMathematicsResponse(message)}

**Need more help?**
- Show me the specific calculation steps
- Explain the mathematical concept
- Provide similar practice problems
- Clarify any formulas or theorems

Feel free to ask for step-by-step solutions or explanations of mathematical concepts!`;
  }

  private static handleProgrammingQuestion(message: string, context?: string): string {
    return `💻 **Programming Assistance**

I can help you with programming in multiple languages! Here's my response:

${this.getProgrammingResponse(message)}

**Programming Languages I Support:**
- Java, Python, C++, C, JavaScript, HTML/CSS
- Data Structures & Algorithms
- Object-Oriented Programming
- Web Development
- Software Engineering Concepts

Would you like code examples, debugging help, or concept explanations?`;
  }

  private static handleScienceQuestion(message: string, context?: string): string {
    return `🔬 **Science Explanation**

Let me explain this scientific concept:

${this.getScienceResponse(message)}

**Science Areas I Cover:**
- Physics (Mechanics, Thermodynamics, Quantum Physics)
- Chemistry (Organic, Inorganic, Physical Chemistry)
- Biology (Cell Biology, Genetics, Ecology, Anatomy)
- Earth Science, Astronomy, Environmental Science

Would you like more detailed explanations or related concepts?`;
  }

  private static handleEngineeringQuestion(message: string, context?: string): string {
    return `⚙️ **Engineering Solution**

Here's my engineering perspective on your question:

${this.getEngineeringResponse(message)}

**Engineering Disciplines I Support:**
- Mechanical, Electrical, Civil, Chemical Engineering
- Software Engineering & Computer Systems
- Industrial Engineering & Operations Research
- Biomedical Engineering

Need design principles, calculations, or system analysis?`;
  }

  private static getMathematicsResponse(message: string): string {
    if (message.includes('derivative')) {
      return `For derivatives, I can help with:
- Power rule: d/dx(x^n) = nx^(n-1)
- Product rule: d/dx(uv) = u'v + uv'
- Chain rule: d/dx(f(g(x))) = f'(g(x)) × g'(x)
- Common derivatives and their applications`;
    }
    
    if (message.includes('integral')) {
      return `For integrals, I can assist with:
- Basic integration rules
- Integration by parts: ∫u dv = uv - ∫v du
- Substitution method
- Definite and indefinite integrals`;
    }

    return `I can solve various mathematical problems including:
- Algebraic equations and systems
- Calculus (derivatives, integrals, limits)
- Statistical analysis and probability
- Geometric calculations and proofs
- Linear algebra and matrix operations`;
  }

  private static getProgrammingResponse(message: string): string {
    if (message.toLowerCase().includes('java')) {
      return `**Java Programming Help:**
\`\`\`java
// Example Java code structure
public class Example {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`
I can help with Java syntax, OOP concepts, data structures, and algorithms.`;
    }

    if (message.toLowerCase().includes('python')) {
      return `**Python Programming Help:**
\`\`\`python
# Example Python code
def hello_world():
    print("Hello, World!")
    
hello_world()
\`\`\`
I can assist with Python syntax, libraries, data analysis, and machine learning.`;
    }

    return `I can help with programming in multiple languages:
- Syntax and language features
- Algorithm design and implementation
- Data structures (arrays, lists, trees, graphs)
- Object-oriented programming concepts
- Debugging and optimization techniques`;
  }

  private static getScienceResponse(message: string): string {
    if (message.toLowerCase().includes('physics')) {
      return `**Physics Concepts:**
- Mechanics: F = ma (Newton's Second Law)
- Energy: E = mc² (Einstein's Mass-Energy Equivalence)
- Waves, Electricity, Magnetism, Thermodynamics
- Quantum Physics and Relativity`;
    }

    if (message.toLowerCase().includes('chemistry')) {
      return `**Chemistry Principles:**
- Periodic Table and Element Properties
- Chemical Bonding (ionic, covalent, metallic)
- Chemical Reactions and Stoichiometry
- Organic Chemistry and Molecular Structures`;
    }

    if (message.toLowerCase().includes('biology')) {
      return `**Biology Concepts:**
- Cell Structure and Function
- DNA, RNA, and Protein Synthesis
- Genetics and Heredity
- Evolution and Ecology
- Human Anatomy and Physiology`;
    }

    return `I can explain scientific concepts across multiple disciplines with detailed explanations, examples, and real-world applications.`;
  }

  private static getEngineeringResponse(message: string): string {
    return `**Engineering Principles:**
- Problem-solving methodologies
- Design thinking and optimization
- Mathematical modeling and analysis
- System integration and testing
- Safety, ethics, and sustainability considerations

I can help with calculations, design principles, and engineering analysis.`;
  }

  private static isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'greetings'];
    const lowerMessage = message.toLowerCase().trim();
    return greetings.some(greeting => lowerMessage.includes(greeting)) || lowerMessage.length < 10;
  }

  private static isColorQuestion(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes('color') && (lowerMessage.includes('name') || lowerMessage.includes('list') || lowerMessage.includes('give me'));
  }

  private static isListRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (lowerMessage.includes('give me') || lowerMessage.includes('list') || lowerMessage.includes('name')) && 
           (lowerMessage.includes('5') || lowerMessage.includes('five') || lowerMessage.includes('10') || lowerMessage.includes('ten'));
  }

  private static getColorResponse(): string {
    return `🎨 **Here are 5 beautiful colors:**

1. **Red** - The color of passion, roses, and fire 🔴
2. **Blue** - The color of the sky, ocean, and tranquility 🔵
3. **Green** - The color of nature, grass, and growth 🟢
4. **Yellow** - The color of sunshine, happiness, and energy 🟡
5. **Purple** - The color of royalty, creativity, and mystery 🟣

Each color has unique psychological effects and cultural meanings. Would you like to learn more about color psychology or how colors are used in different fields?`;
  }

  private static generateListResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('planet')) {
      return `🌍 **Here are the 8 planets in our solar system:**

1. **Mercury** - Closest to the Sun, very hot
2. **Venus** - Hottest planet, thick atmosphere
3. **Earth** - Our home planet with life
4. **Mars** - The red planet
5. **Jupiter** - Largest planet, gas giant
6. **Saturn** - Famous for its rings
7. **Uranus** - Tilted on its side
8. **Neptune** - Furthest from the Sun, very cold

Would you like to learn more about any specific planet?`;
    }

    if (lowerMessage.includes('programming language')) {
      return `💻 **Here are 5 popular programming languages:**

1. **Python** - Great for beginners, AI, and data science
2. **Java** - Object-oriented, platform-independent
3. **JavaScript** - Essential for web development
4. **C++** - Powerful for system programming and games
5. **C** - Foundation language for understanding programming

Each language has specific use cases and advantages. Which one would you like to learn about?`;
    }

    return `I'd be happy to create a list for you! Could you be more specific about what type of list you're looking for? For example:
- Programming languages, scientific concepts, mathematical formulas
- Historical events, biological systems, chemical elements
- Engineering principles, physics laws, etc.

Just let me know the topic and I'll provide a detailed list!`;
  }

  private static getGreetingResponse(): string {
    const greetings = [
      "Hello! I'm EduBot, your comprehensive AI study companion! 🤖✨ I can help you with:\n\n📚 **Academic Subjects:** Math, Science, Physics, Chemistry, Biology\n💻 **Programming:** Java, Python, C++, JavaScript, and more\n🔬 **Advanced Topics:** Machine Learning, Engineering, Data Science\n🖼️ **Tools:** Image text extraction, summaries, translations\n🗣️ **Voice:** Interactive voice conversations\n\nWhat subject or topic would you like to explore today?",
      "Hi there! Welcome to your AI-powered learning experience! 🎓 I'm equipped to handle:\n\n🔢 **Mathematics:** From basic algebra to advanced calculus\n🧪 **Sciences:** Physics, Chemistry, Biology, and more\n💻 **Programming:** All major languages and concepts\n⚙️ **Engineering:** Multiple disciplines and applications\n📄 **Document Processing:** OCR, summaries, Q&A\n🌍 **Multi-language:** Translation and voice support\n\nHow can I help you learn something new today?",
      "Hey! Great to see you! I'm your dedicated AI tutor ready to tackle any academic challenge! 📖💡 I specialize in:\n\n🎯 **All Academic Levels:** From high school to university\n🔍 **Research & Analysis:** Deep explanations and examples\n📊 **Problem Solving:** Step-by-step solutions\n🗣️ **Interactive Learning:** Voice and visual aids\n🌐 **Global Accessibility:** Multiple languages supported\n\nWhat subject or specific question interests you today?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private static getComprehensiveAcademicResponse(message: string, topic: string, context?: string): string {
    const contextNote = context ? "\n\n💡 I can provide more specific answers based on the context you've shared with me." : "";
    
    const academicResponses: Record<string, string[]> = {
      mathematics: [
        `🔢 **Mathematics Excellence!** I can help you with comprehensive mathematical concepts:\n\n• **Algebra & Equations:** Linear, quadratic, polynomial solutions\n• **Calculus:** Derivatives, integrals, limits, and applications\n• **Statistics:** Probability, distributions, hypothesis testing\n• **Geometry:** Euclidean, coordinate, and analytical geometry\n• **Advanced Topics:** Linear algebra, differential equations\n\nShare your specific math problem or concept for detailed explanations!${contextNote}`,
        `📐 **Mathematical Problem Solving!** I excel at:\n\n• **Step-by-step Solutions:** Clear methodology and reasoning\n• **Conceptual Understanding:** Why formulas work, not just how\n• **Real-world Applications:** Practical uses of mathematical concepts\n• **Multiple Approaches:** Different ways to solve the same problem\n• **Verification Methods:** How to check your answers\n\nWhat mathematical challenge can I help you conquer today?${contextNote}`,
      ],
      programming: [
        `💻 **Programming Mastery!** I can assist with all major programming languages:\n\n• **Languages:** Java, Python, C++, C, JavaScript, HTML/CSS\n• **Concepts:** OOP, Data Structures, Algorithms, Design Patterns\n• **Development:** Web development, mobile apps, software engineering\n• **Debugging:** Code analysis, error resolution, optimization\n• **Best Practices:** Clean code, documentation, testing\n\nShare your code or programming question for detailed help!${contextNote}`,
        `🚀 **Code Development Support!** I specialize in:\n\n• **Algorithm Design:** Efficient solutions and complexity analysis\n• **Data Structures:** Arrays, linked lists, trees, graphs, hash tables\n• **Software Engineering:** Architecture, design patterns, methodologies\n• **Code Review:** Quality assessment and improvement suggestions\n• **Learning Paths:** Structured approaches to master programming\n\nWhat programming challenge are you working on?${contextNote}`,
      ],
      physics: [
        `⚡ **Physics Exploration!** I can explain all areas of physics:\n\n• **Classical Mechanics:** Motion, forces, energy, momentum\n• **Thermodynamics:** Heat, temperature, entropy, gas laws\n• **Electromagnetism:** Electric fields, magnetic fields, circuits\n• **Quantum Physics:** Wave-particle duality, uncertainty principle\n• **Relativity:** Special and general relativity concepts\n\nWhat physics phenomenon would you like to understand?${contextNote}`,
        `🌌 **Physics Problem Solving!** I excel at:\n\n• **Mathematical Physics:** Applying math to physical problems\n• **Conceptual Understanding:** Intuitive explanations of complex topics\n• **Laboratory Applications:** Practical physics and measurements\n• **Real-world Examples:** Physics in everyday life and technology\n• **Advanced Topics:** Modern physics and cutting-edge research\n\nShare your physics question for comprehensive analysis!${contextNote}`,
      ],
      chemistry: [
        `🧪 **Chemistry Expertise!** I can help with all branches of chemistry:\n\n• **Organic Chemistry:** Carbon compounds, reactions, mechanisms\n• **Inorganic Chemistry:** Elements, compounds, crystal structures\n• **Physical Chemistry:** Thermodynamics, kinetics, quantum chemistry\n• **Analytical Chemistry:** Spectroscopy, chromatography, titrations\n• **Biochemistry:** Biological molecules and metabolic pathways\n\nWhat chemical concept or reaction needs explanation?${contextNote}`,
        `⚛️ **Chemical Understanding!** I specialize in:\n\n• **Molecular Structure:** Bonding, geometry, intermolecular forces\n• **Chemical Reactions:** Mechanisms, kinetics, equilibrium\n• **Stoichiometry:** Calculations and quantitative analysis\n• **Laboratory Techniques:** Procedures, safety, and analysis\n• **Industrial Applications:** Real-world chemistry and processes\n\nShare your chemistry question for detailed analysis!${contextNote}`,
      ],
      biology: [
        `🧬 **Biology Mastery!** I can explain all aspects of life sciences:\n\n• **Cell Biology:** Structure, function, organelles, processes\n• **Genetics:** DNA, RNA, inheritance, gene expression\n• **Evolution:** Natural selection, speciation, phylogeny\n• **Ecology:** Ecosystems, biodiversity, environmental interactions\n• **Physiology:** Organ systems, homeostasis, regulation\n\nWhat biological concept would you like to explore?${contextNote}`,
        `🌱 **Life Science Exploration!** I excel at:\n\n• **Molecular Biology:** Protein synthesis, gene regulation, biotechnology\n• **Anatomy:** Human body systems and their interactions\n• **Ecology:** Environmental science and conservation biology\n• **Research Methods:** Experimental design and data analysis\n• **Current Topics:** Latest discoveries and applications\n\nWhat aspect of biology interests you most?${contextNote}`,
      ],
      general: [
        `🎓 **Comprehensive Academic Support!** I'm ready to help with any subject:\n\n📚 **STEM Fields:** Math, Science, Engineering, Technology\n💻 **Computer Science:** Programming, algorithms, software development\n🔬 **Research:** Analysis, methodology, critical thinking\n📖 **Study Skills:** Learning techniques, problem-solving strategies\n🌍 **Interdisciplinary:** Connections between different fields\n\nWhat academic challenge can I help you with today?${contextNote}`,
        `💡 **Educational Excellence!** I'm equipped to assist with:\n\n🎯 **Subject Mastery:** Deep understanding across all disciplines\n📊 **Problem Solving:** Systematic approaches to complex challenges\n🔍 **Research Support:** Information gathering and analysis\n🧠 **Concept Building:** Building knowledge from fundamentals\n🌐 **Global Perspective:** Multiple viewpoints and applications\n\nFeel free to ask me anything academic - I'm here to help you succeed!${contextNote}`,
      ]
    };

    const responses = academicResponses[topic] || academicResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static getIntelligentFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "🤝 **Comprehensive Academic Assistant!** I'm your AI tutor with expertise in:\n\n📚 **All Academic Subjects:** Mathematics, Science, Programming, Engineering\n🔬 **Research Tools:** OCR text extraction, intelligent summaries\n🌐 **Language Support:** Multi-language translation and voice interaction\n💻 **Programming Help:** Java, Python, C++, JavaScript, and more\n🧮 **Problem Solving:** Step-by-step solutions and explanations\n\nTry asking me specific questions about any academic topic, upload study materials, or request detailed explanations!";
    }
    
    if (lowerMessage.includes('calculate') || lowerMessage.includes('math')) {
      return "🔢 **Mathematics Ready!** I can help you with:\n\n➕ **Basic Operations:** Arithmetic, percentages, conversions\n📐 **Geometry:** Area, volume, trigonometry calculations\n📊 **Statistics:** Mean, median, standard deviation, probability\n🧮 **Calculus:** Derivatives, integrals, limits\n🔢 **Algebra:** Equations, systems, polynomials\n\nShare your mathematical problem for step-by-step solutions!";
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('program')) {
      return "💻 **Programming Expert!** I can assist with:\n\n☕ **Java:** Object-oriented programming, data structures\n🐍 **Python:** Syntax, libraries, data science, machine learning\n⚡ **JavaScript:** Web development, DOM manipulation, frameworks\n🔧 **C/C++:** System programming, algorithms, performance optimization\n🌐 **Web Development:** HTML, CSS, responsive design\n\nShare your code or programming question for detailed help!";
    }
    
    return `🎓 **Ready to Learn!** I'm your comprehensive AI study assistant specializing in:\n\n🔬 **STEM Education:** Mathematics, Physics, Chemistry, Biology\n💻 **Computer Science:** Programming, algorithms, software development\n⚙️ **Engineering:** All major engineering disciplines\n📚 **Study Support:** Summaries, explanations, problem-solving\n🗣️ **Interactive Learning:** Voice input/output, visual aids\n\nWhat specific academic topic or question would you like to explore? I'm here to provide detailed, accurate, and educational responses!`;
  }

  static getStudyAnalytics() {
    return ClusteringService.getStudyStats();
  }

  static async processImageAndSummarize(text: string): Promise<{ summary: string; topic: string }> {
    const summary = await this.summarizeText(text);
    const topic = await this.detectTopic(text);
    return { summary, topic };
  }
}

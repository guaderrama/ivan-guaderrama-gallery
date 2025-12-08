import { Course } from '../types';

export const coursesData: Course[] = [
  {
    id: "course-psych-sales",
    title: "Aprende a Vender",
    subtitle: "La Psicología para Duplicar tus Ventas",
    author: "Ivan Guaderrama",
    description: "Un curso transformacional basado en la ciencia del comportamiento humano. Descubre por qué el éxito en ventas es 80% psicológico y solo 20% técnico. Aprende a dominar tu 'Juego Interior' con evidencia científica de la neurociencia y psicología.",
    quotes: [
        {
            text: "Porque cual es su pensamiento en su corazón, tal es él...",
            author: "Proverbios 23:7"
        },
        {
            text: "La confianza, la seguridad y la convicción no están en el folleto. Están en ti. Son 100% psicología.",
            highlight: true
        },
        {
            text: "Así como el Hijo del Hombre no vino para ser servido, sino para servir, y para dar su vida en rescate por muchos.",
            author: "Mateo 20:28"
        }
    ],
    modules: [
      {
        id: "mod-1",
        title: "Módulo 1: La Revolución Psicológica",
        description: "El fundamento del éxito moderno. Comprender que las ventas ya no dependen del producto, sino de la mente del vendedor.",
        keyPoints: [
          "El 'Juego Interior' (Mentalidad, Actitud) controla el 80% de tus resultados.",
          "El 'Juego Exterior' (Técnica, Producto) solo impacta el 20%.",
          "La mayoría de los vendedores fallan porque entrenan el 20% y descuidan el 80%.",
          "Ley de Pareto: El 80% de tu riqueza viene del 20% de tus acciones vitales."
        ],
        quote: {
            text: "Impacta de manera efectiva en las personas.",
            author: "Dale Carnegie"
        },
        examples: [
            {
                title: "Origen de la Ley 80/20 (Vilfredo Pareto)",
                content: "Hace más de 100 años, el economista Vilfredo Pareto notó que el 80% de la riqueza en Italia pertenecía al 20% de la población. Luego descubrió que esto aplicaba a todo (ropa, tráfico, ventas).",
                result: "En ventas: El 80% de tus comisiones provienen del 20% de tus clientes o del 20% del tiempo que pasas frente a ellos.",
                lesson: "Deja de 'estar ocupado'. Identifica tu 20% vital y delega o elimina el resto."
            }
        ],
        activities: [
            {
                title: "Auditoría de Tiempo 80/20",
                description: "Descubre dónde se fuga tu dinero.",
                steps: [
                    "Lista todas las actividades que hiciste ayer.",
                    "Marca con '$$' las que implicaron hablar con un cliente o pedir una venta (El 20%).",
                    "Marca con 'X' las administrativas, viajes o redes sociales (El 80%).",
                    "Meta: Reemplaza 30 minutos de 'X' por 30 minutos de '$$' mañana."
                ]
            }
        ]
      },
      {
        id: "mod-2",
        title: "Módulo 2: Reprogramación Mental (Leyes del Éxito)",
        description: "Tu cerebro es hardware biológico. Aprende cómo la neuroplasticidad y las creencias alteran tu realidad física y tus ventas.",
        keyPoints: [
          "Ley de Causa y Efecto: El éxito tiene una receta, no es suerte.",
          "Ley del Convencimiento: Tus creencias filtran la realidad.",
          "Ley de Expectativas: Obtienes lo que esperas, no lo que quieres.",
          "Ley de Emociones: Sin emoción no hay decisión.",
          "Ley de Atracción: Tu SARA (Sistema Reticular) busca lo que piensas."
        ],
        quote: {
            text: "No crees lo que ves; ves lo que crees.",
            author: "Brian Tracy"
        },
        examples: [
            {
                title: "El Cerebro del Taxista (Neuroplasticidad)",
                content: "Estudio del año 2000 en Londres. Se escanearon cerebros de taxistas que memorizaron 25,000 calles.",
                result: "Su hipocampo (centro de memoria) creció físicamente, siendo más grande que el promedio.",
                lesson: "Tu cerebro cambia físicamente según lo que le das. Si estudias ventas y éxito, tu cerebro desarrollará 'músculo' para vender."
            },
            {
                title: "El Estudio del Vino (Creencias)",
                content: "Stanford dio a probar el mismo vino a personas, etiquetado como de $5 y de $45. Monitorearon sus cerebros.",
                result: "La zona de placer se activó más con el vino 'caro'. La creencia cambió la biología del disfrute.",
                lesson: "Si tú crees que tu arte es valioso, el cliente sentirá ese valor biológicamente."
            },
            {
                title: "Las Ratas Genio (Efecto Pigmalión)",
                content: "Estudiantes entrenaron ratas. A un grupo se les dijo que sus ratas eran 'genios', al otro que eran 'tontas'. Todas eran iguales.",
                result: "Las 'ratas genio' resolvieron laberintos más rápido porque los estudiantes las trataron con más confianza y paciencia.",
                lesson: "Trata a cada prospecto como si ya te hubiera comprado, y su comportamiento cambiará a tu favor."
            },
            {
                 title: "El Paciente Elliot (Emociones)",
                 content: "Antonio Damasio estudió a un hombre con daño en la zona emocional del cerebro, pero con IQ intacto.",
                 result: "Era incapaz de tomar decisiones simples (como qué comer), porque la lógica analiza, pero la emoción decide.",
                 lesson: "Deja de vender solo lógica/datos. Si no haces sentir algo al cliente, es biológicamente imposible que compre."
            }
        ],
        activities: [
            {
                title: "Dieta Mental de 7 Días",
                description: "Reprograma tu SARA (Sistema de Atracción).",
                steps: [
                    "Durante 7 días, prohibido quejarse o criticar.",
                    "Cada mañana, escribe 3 razones por las que tu producto cambia vidas.",
                    "Antes de cada llamada, visualiza al cliente sonriendo y pagando.",
                    "Si fallas un pensamiento, reinicia el contador de días."
                ]
            }
        ]
      },
      {
        id: "mod-3",
        title: "Módulo 3: Actitud Mental Positiva (AMP)",
        description: "La resiliencia no es un rasgo de carácter, es una habilidad aprendida. La ciencia del optimismo en ventas.",
        keyPoints: [
          "AMP no es felicidad ciega, es 'Inmunidad Psicológica' al rechazo.",
          "El vendedor promedio se rinde tras el primer 'No'. El experto lo ve como un paso estadístico.",
          "Tu actitud se contagia más rápido que tus palabras."
        ],
        quote: {
            text: "Si debes hablar mal de otro, pues no lo hagas. Escríbelo en la arena cerca del borde del agua.",
            author: "Napoleon Hill"
        },
        examples: [
             {
                title: "El Experimento MetLife (Optimismo)",
                content: "En los 80, MetLife contrató al psicólogo Martin Seligman. Contrataron 'Súper Optimistas' que reprobaron el test de aptitud técnica, para competir contra pesimistas expertos.",
                result: "Los optimistas vendieron 21% más el primer año y 57% más el segundo año.",
                lesson: "La actitud vence a la aptitud. Contrata y entrena actitud antes que técnica."
             }
        ],
        activities: [
            {
                title: "Reencuadre del Rechazo",
                description: "Cambia tu relación con el 'No'.",
                steps: [
                    "Calcula tu promedio: Si necesitas 10 'No' para 1 'Sí' y ganas $1000 por venta...",
                    "Cada 'No' vale $100. (1000 / 10).",
                    "La próxima vez que te digan 'No', di mentalmente: 'Gracias por mis $100'.",
                    "Escribe 3 cosas que aprendiste de tu último rechazo."
                ]
            }
        ]
      },
      {
        id: "mod-4",
        title: "Módulo 4: Simpatía y Conexión Humana",
        description: "La gente compra a gente que le cae bien. La psicología de la confianza instantánea.",
        keyPoints: [
          "Simpatía es la puerta de la confianza.",
          "Principio de Similitud: Nos gusta la gente que se parece a nosotros (tono, postura, palabras).",
          "Efecto Halo: Si les caes bien, asumen que tu producto es bueno."
        ],
        quote: {
            text: "Vendes Confianza, Vendes Seguridad, Vendes Convicción.",
            author: "Psicología de Ventas"
        },
        examples: [
            {
                title: "El Efecto Camaleón (Holland Study)",
                content: "Estudio con meseros. Un grupo solo decía 'Oído' al tomar la orden. El otro grupo repetía (imitaba) las palabras exactas del cliente.",
                result: "Los meseros que imitaron recibieron 68% más propinas.",
                lesson: "Usa el 'Mirroring'. Repite sutilmente las palabras clave y el lenguaje corporal de tu cliente para crear conexión subconsciente."
            }
        ],
        activities: [
             {
                title: "Práctica de Espejo (Mirroring)",
                description: "Genera confianza subconsciente.",
                steps: [
                    "En tu próxima conversación (incluso con amigos), observa su postura.",
                    "Espera 10 segundos y adopta sutilmente una postura similar.",
                    "Escucha sus palabras favoritas (ej: 'fantástico', 'complicado') y úsalas en tu respuesta.",
                    "Nota si la conversación fluye más suavemente."
                ]
            }
        ]
      },
      {
        id: "mod-5",
        title: "Módulo 5: Imagen y Energía (Pulchronomics)",
        description: "Tu cuerpo es tu herramienta de ventas. Cómo tu apariencia y energía afectan la percepción de valor.",
        keyPoints: [
          "Venta es transferencia de energía. Si tú estás bajo, el producto se siente 'pesado'.",
          "No tienes una segunda oportunidad para una primera impresión.",
          "Salud = Éxito en la mente primitiva del cliente."
        ],
        examples: [
             {
                title: "Pulchronomics (La Prima de Belleza)",
                content: "El economista Daniel Hamermesh estudió el impacto de la apariencia.",
                result: "Personas bien arregladas ganan 12-14% más en su vida. El mercado paga una prima por la buena presencia.",
                lesson: "Tu imagen es tu inversión más rentable (ROI)."
             },
             {
                 title: "La Regla de los 100 Milisegundos (Princeton)",
                 content: "Investigadores mostraron caras a participantes por 1/10 de segundo.",
                 result: "La amígdala decide si eres 'confiable' o 'competente' en 100ms, antes de que hables.",
                 lesson: "Tu 'Hola' llega tarde. Tu ropa, aseo y sonrisa ya vendieron (o perdieron) antes de abrir la boca."
             }
        ],
        activities: [
            {
                title: "Auditoría de Imagen de 10 Puntos",
                description: "¿Qué dice tu apariencia de ti?",
                steps: [
                    "Pregunta a 3 personas honestas: '¿Qué profesión parezco tener basado solo en mi ropa de hoy?'",
                    "Evalúa tus zapatos, uñas y cabello. Son los 3 puntos focales de detalle.",
                    "Sube tu energía: Haz 10 saltos o respira profundo antes de entrar a la galería/tienda."
                ]
            }
        ]
      },
      {
        id: "mod-6",
        title: "Módulo 6: Prospección (El Oxígeno del Negocio)",
        description: "Elimina la 'montaña rusa' de ingresos manteniendo tu embudo lleno.",
        keyPoints: [
          "Embudo vacío = Desesperación = El cliente huele el miedo.",
          "Mentalidad de Abundancia: 'Hay miles de clientes esperando'.",
          "La persistencia es estadística, no mágica."
        ],
        examples: [
            {
                title: "La Regla del 5º Contacto",
                content: "Datos de la National Sales Executive Association.",
                result: "48% de los vendedores renuncian tras el 1er contacto. Pero el 80% de las ventas se cierran entre el 5º y el 12º contacto.",
                lesson: "La mayoría abandona a metros de la mina de oro. Tu seguimiento te hace destacar del 90% de la competencia."
            }
        ],
        activities: [
            {
                title: "Matemática del Embudo",
                description: "Convierte la ansiedad en estadística.",
                steps: [
                    "Define tu meta mensual (ej: $10,000).",
                    "Divide por tu venta promedio (ej: $1,000) = 10 ventas.",
                    "Si cierras 1 de cada 5, necesitas 50 prospectos.",
                    "Tu tarea no es vender, es encontrar 50 personas. La venta ocurrirá sola por estadística."
                ]
            }
        ]
      }
    ],
    quiz: [
        {
            id: 1,
            question: "¿Según la Ley de Pareto (80/20) aplicada a ventas, de dónde provienen el 80% de tus comisiones?",
            options: [
                "Del 80% de tus clientes que compran poco.",
                "Del 20% de tus clientes o actividades vitales.",
                "De trabajar un 80% más de horas.",
                "De saber un 80% sobre el producto."
            ],
            correctAnswer: 1,
            explanation: "Vilfredo Pareto descubrió que la minoría de las causas (20%) genera la mayoría de los efectos (80%). En ventas, enfócate en tus clientes 'vitales'."
        },
        {
            id: 2,
            question: "En el estudio de MetLife sobre 'Optimismo', ¿qué grupo vendió más?",
            options: [
                "Los vendedores con mayor aptitud técnica y experiencia.",
                "Los vendedores con mayor coeficiente intelectual.",
                "Los 'Súper Optimistas' que reprobaron el test de aptitud.",
                "Los que trabajaron más horas al día."
            ],
            correctAnswer: 2,
            explanation: "La actitud vence a la aptitud. Los optimistas vendieron 57% más en su segundo año porque tienen 'inmunidad psicológica' al rechazo."
        },
        {
            id: 3,
            question: "¿Qué demostró el estudio del 'Vino de Stanford' sobre el precio y el cerebro?",
            options: [
                "Que la gente prefiere el vino barato.",
                "Que el cerebro no distingue precios.",
                "Que la creencia de un precio alto activa biológicamente más placer.",
                "Que el sabor es lo único que importa."
            ],
            correctAnswer: 2,
            explanation: "Tus creencias alteran tu biología. Si crees (y haces creer al cliente) que tu producto es valioso, ellos lo disfrutarán más."
        },
        {
            id: 4,
            question: "Según el estudio de meseros (Efecto Camaleón), ¿cómo aumentaron sus propinas un 68%?",
            options: [
                "Sonriendo más.",
                "Sirviendo más rápido.",
                "Repitiendo (imitando) exactamente las palabras del cliente.",
                "Haciendo descuentos."
            ],
            correctAnswer: 2,
            explanation: "El 'Mirroring' o imitación crea una conexión subconsciente inmediata porque nos gusta la gente que se parece a nosotros."
        },
        {
            id: 5,
            question: "¿En cuánto tiempo decide la amígdala si eres confiable (Regla de Princeton)?",
            options: [
                "En los primeros 5 minutos de conversación.",
                "En 100 milisegundos (1/10 de segundo).",
                "Después de escuchar tu presentación.",
                "Al final de la venta."
            ],
            correctAnswer: 1,
            explanation: "Tu imagen vende antes de que abras la boca. La primera impresión es biológica e instantánea."
        }
    ]
  }
];

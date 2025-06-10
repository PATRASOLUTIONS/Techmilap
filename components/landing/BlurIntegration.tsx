"use client";

import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { Fragment, type HTMLAttributes } from "react";

function Tag(props: HTMLAttributes<HTMLDivElement>) {
  const { className, children, ...otherProps } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={twMerge(
        "inline-flex border border-[#b8860b] gap-2 text-[#b8860b] px-4 py-1.5 rounded-full uppercase items-center font-medium",
        className
      )}
      {...otherProps}
    >
      <span>&#10038;</span>
      <span className="text-sm tracking-wider">{children}</span>
    </motion.div>
  );
}

// SVG Icons as React components
function FigmaIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" rx="100" fill="white" />
      <path
        d="M155 335C179.84 335 200 314.84 200 290V245H155C130.16 245 110 265.16 110 290C110 314.84 130.16 335 155 335Z"
        fill="#0ACF83"
      />
      <path
        d="M110 200C110 175.16 130.16 155 155 155H200V245H155C130.16 245 110 224.84 110 200Z"
        fill="#A259FF"
      />
      <path
        d="M110 110C110 85.16 130.16 65 155 65H200V155H155C130.16 155 110 134.84 110 110Z"
        fill="#F24E1E"
      />
      <path
        d="M200 65H245C269.84 65 290 85.16 290 110C290 134.84 269.84 155 245 155H200V65Z"
        fill="#FF7262"
      />
      <path
        d="M290 200C290 224.84 269.84 245 245 245C220.16 245 200 224.84 200 200C200 175.16 220.16 155 245 155C269.84 155 290 175.16 290 200Z"
        fill="#1ABCFE"
      />
    </svg>
  );
}

function FramerIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" rx="100" fill="white" />
      <path
        d="M112 68H288V156H200L112 68ZM112 156H200L288 244H112V156ZM112 244H200V332L112 244Z"
        fill="black"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" rx="100" fill="white" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M200 75C128.727 75 71 132.582 71 203.674C71 260.613 107.926 308.705 159.204 325.754C165.654 326.88 168.072 323.02 168.072 319.642C168.072 316.586 167.911 306.453 167.911 295.677C135.5 301.628 127.115 287.795 124.535 280.557C123.084 276.858 116.795 265.438 111.312 262.382C106.797 259.969 100.347 254.018 111.151 253.857C121.31 253.697 128.566 263.186 130.985 267.047C142.595 286.509 161.139 281.04 168.556 277.662C169.685 269.298 173.071 263.669 176.78 260.452C148.077 257.235 118.085 246.137 118.085 196.919C118.085 182.926 123.084 171.345 131.308 162.338C130.018 159.121 125.502 145.932 132.597 128.239C132.597 128.239 143.401 124.861 168.072 141.428C178.392 138.533 189.358 137.085 200.323 137.085C211.288 137.085 222.253 138.533 232.573 141.428C257.244 124.7 268.048 128.239 268.048 128.239C275.143 145.932 270.628 159.121 269.338 162.338C277.561 171.345 282.56 182.765 282.56 196.919C282.56 246.298 252.406 257.235 223.704 260.452C228.38 264.473 232.411 272.193 232.411 284.257C232.411 301.467 232.25 315.299 232.25 319.642C232.25 323.02 234.669 327.041 241.119 325.754C292.074 308.705 329 260.452 329 203.674C329 132.582 271.273 75 200 75Z"
        fill="#1B1F23"
      />
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" rx="100" fill="white" />
      <path
        d="M117.455 114.109C125.626 120.755 128.691 120.248 144.033 119.223L288.68 110.528C291.746 110.528 289.195 107.464 288.174 106.955L264.15 89.5681C259.548 85.9905 253.414 81.8932 241.662 82.9181L101.601 93.1455C96.4932 93.6526 95.4728 96.2093 97.5072 98.259L117.455 114.109ZM126.139 147.858V300.227C126.139 308.415 130.226 311.479 139.426 310.973L298.392 301.764C307.596 301.257 308.621 295.623 308.621 288.972V137.626C308.621 130.985 306.07 127.403 300.435 127.914L134.314 137.626C128.184 138.142 126.139 141.212 126.139 147.858ZM283.07 156.031C284.089 160.638 283.07 165.24 278.46 165.758L270.801 167.285V279.773C264.15 283.352 258.018 285.397 252.908 285.397C244.727 285.397 242.678 282.839 236.55 275.173L186.449 196.431V272.617L202.303 276.198C202.303 276.198 202.303 285.397 189.512 285.397L154.251 287.445C153.227 285.397 154.251 280.289 157.828 279.265L167.029 276.712V175.981L154.253 174.956C153.229 170.349 155.781 163.708 162.942 163.192L200.769 160.64L252.908 240.407V169.842L239.615 168.315C238.594 162.683 242.678 158.594 247.79 158.087L283.07 156.031ZM89.8411 79.3405L235.527 68.5998C253.418 67.0636 258.02 68.0926 269.265 76.2703L315.768 108.994C323.443 114.621 326 116.153 326 122.287V301.764C326 313.01 321.908 319.663 307.598 320.68L138.414 330.91C127.673 331.422 122.56 329.889 116.935 322.726L82.6884 278.242C76.5518 270.054 74 263.927 74 256.76V97.2301C74 88.0318 78.0938 80.3592 89.8411 79.3405Z"
        fill="black"
      />
    </svg>
  );
}

function RelumeIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" rx="100" fill="white" />
      <path
        d="M125.088 175.145C111.718 175.145 109.138 186.565 109.138 199.925C109.138 213.285 111.718 223.526 125.088 223.526C138.457 223.526 159.661 248.57 161.712 199.335C163.785 149.577 138.457 175.145 125.088 175.145Z"
        fill="#FF6948"
      />
      <path
        d="M306.764 255.945C320.133 255.945 309.737 212.105 309.737 198.745C309.737 185.386 320.133 146.851 306.764 146.851C293.395 146.851 279.269 150.1 277.218 199.335C275.145 249.093 293.395 255.945 306.764 255.945Z"
        fill="#6248FF"
      />
      <path
        d="M330.75 131.199L329.05 127.801C326.5 123.554 323.101 120.157 318.85 117.608L223.65 63.2472C219.401 60.6989 214.3 59.8495 209.2 59H204.95C199.85 59 194.749 60.6989 190.5 63.2472L95.3 118.458C91.0512 121.006 87.65 124.404 85.0996 128.651L83.3995 132.048C81.6994 135.446 80 140.542 80 144.789V254.361C80 259.458 81.6994 264.554 83.3995 268.801L85.0996 272.199C87.65 276.446 91.0512 279.845 95.3 282.392L190.5 336.753C194.75 339.301 199.85 341 204.95 341H209.2C214.3 341 219.401 339.301 223.65 336.753L318.85 281.542C323.101 278.995 326.5 275.596 329.05 271.349L330.75 267.952C333.3 263.705 334.15 258.608 335 253.512V144.789C335 139.693 333.3 135.446 330.75 131.199Z"
        fill="black"
      />
      <path
        d="M330.75 131.199L329.05 127.801C326.5 123.554 323.101 120.157 318.85 117.608L223.65 63.2472C219.401 60.6989 214.3 59.8495 209.2 59H204.95C199.85 59 194.749 60.6989 190.5 63.2472L95.3 118.458C91.0512 121.006 87.65 124.404 85.0996 128.651L83.3995 132.048C81.6994 135.446 80 140.542 80 144.789V254.361C80 259.458 81.6994 264.554 83.3995 268.801L85.0996 272.199C87.65 276.446 91.0512 279.845 95.3 282.392L190.5 336.753C194.75 339.301 199.85 341 204.95 341H209.2C214.3 341 219.401 339.301 223.65 336.753L318.85 281.542C323.101 278.995 326.5 275.596 329.05 271.349L330.75 267.952C333.3 263.705 334.15 258.608 335 253.512V144.789C335 139.693 333.3 135.446 330.75 131.199Z"
        fill="url(#paint0_linear_3_3)"
      />
      <path
        d="M311.073 142.184L309.643 139.329C307.501 135.76 304.644 132.905 301.073 130.763L221.073 85.0813C217.502 82.9409 213.216 82.2261 208.929 81.5127H205.358C201.073 81.5127 196.786 82.9409 193.215 85.0813L113.216 131.478C109.644 133.618 106.787 136.474 104.644 140.042L103.215 142.897C101.787 145.753 100.359 150.036 100.359 153.605V245.682C100.359 249.965 101.787 254.247 103.215 257.816L104.644 260.671C106.787 264.241 109.644 267.096 113.216 269.237L193.215 314.919C196.786 317.06 201.073 318.487 205.358 318.487H208.929C213.216 318.487 217.502 317.06 221.073 314.919L301.073 268.523C304.644 266.382 307.501 263.526 309.643 259.958L311.073 257.103C313.216 253.534 313.93 249.25 314.644 244.968V153.605C314.644 149.321 313.216 145.753 311.073 142.184Z"
        fill="black"
      />
      <path
        d="M288.929 249.25L219.643 289.222V207.139L291.072 165.739V248.537L288.929 249.25Z"
        fill="white"
      />
      <path
        d="M206.071 105.066L207.499 104.353L208.928 105.066L278.928 145.039L207.499 186.439L136.071 145.039L206.071 105.066Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="paint0_linear_3_3"
          x1="44.766"
          y1="158.338"
          x2="325.996"
          y2="195.811"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF7448" />
          <stop offset="0.25" stopColor="#FF5E48" />
          <stop offset="0.5" stopColor="#FF4848" />
          <stop offset="0.75" stopColor="#B048A3" />
          <stop offset="1" stopColor="#6248FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" rx="100" fill="white" />
      <path
        d="M121.726 235.619C121.726 251.23 108.974 263.982 93.3632 263.982C77.7524 263.982 65 251.23 65 235.619C65 220.008 77.7524 207.256 93.3632 207.256H121.726V235.619Z"
        fill="#E01E5A"
      />
      <path
        d="M136.018 235.619C136.018 220.008 148.77 207.256 164.381 207.256C179.992 207.256 192.744 220.008 192.744 235.619V306.637C192.744 322.248 179.992 335 164.381 335C148.77 335 136.018 322.248 136.018 306.637V235.619Z"
        fill="#E01E5A"
      />
      <path
        d="M164.381 121.726C148.77 121.726 136.018 108.974 136.018 93.3632C136.018 77.7524 148.77 65 164.381 65C179.992 65 192.744 77.7524 192.744 93.3632V121.726H164.381Z"
        fill="#36C5F0"
      />
      <path
        d="M164.381 136.018C179.992 136.018 192.744 148.77 192.744 164.381C192.744 179.992 179.992 192.744 164.381 192.744H93.3632C77.7524 192.744 65 179.992 65 164.381C65 148.77 77.7524 136.018 93.3632 136.018H164.381Z"
        fill="#36C5F0"
      />
      <path
        d="M278.274 164.381C278.274 148.77 291.026 136.018 306.637 136.018C322.248 136.018 335 148.77 335 164.381C335 179.992 322.248 192.744 306.637 192.744H278.274V164.381Z"
        fill="#2EB67D"
      />
      <path
        d="M263.982 164.381C263.982 179.992 251.23 192.744 235.619 192.744C220.008 192.744 207.256 179.992 207.256 164.381V93.3632C207.256 77.7524 220.008 65 235.619 65C251.23 65 263.982 77.7524 263.982 93.3632V164.381Z"
        fill="#2EB67D"
      />
      <path
        d="M235.619 278.274C251.23 278.274 263.982 291.026 263.982 306.637C263.982 322.248 251.23 335 235.619 335C220.008 335 207.256 322.248 207.256 306.637V278.274H235.619Z"
        fill="#ECB22E"
      />
      <path
        d="M235.619 263.982C220.008 263.982 207.256 251.23 207.256 235.619C207.256 220.008 220.008 207.256 235.619 207.256H306.637C322.248 207.256 335 220.008 335 235.619C335 251.23 322.248 263.982 306.637 263.982H235.619Z"
        fill="#ECB22E"
      />
    </svg>
  );
}

const integrations = [
  {
    name: "Figma",
    icon: FigmaIcon,
    description: "Figma is a collaborative interface design tool.",
  },
  {
    name: "Notion",
    icon: NotionIcon,
    description: "Notion is an all-in-one workspace for notes and docs.",
  },
  {
    name: "Slack",
    icon: SlackIcon,
    description: "Slack is a powerful team communication platform.",
  },
  {
    name: "Relume",
    icon: RelumeIcon,
    description: "Relume is a no-code website builder and design system.",
  },
  {
    name: "Framer",
    icon: FramerIcon,
    description: "Framer is a professional website prototyping tool.",
  },
  {
    name: "GitHub",
    icon: GitHubIcon,
    description: "GitHub is the leading platform for code collaboration.",
  },
];

export type IntegrationType = typeof integrations;

export function Integrations() {
  return (
    <section className="py-24 overflow-hidden bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-xl"
          >
            <Tag>Integrations</Tag>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium mt-6 text-[#154c79]">
              Plays well with <span className="text-[#b8860b]">others</span>
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Tech Milap seamlessly connects with your favorite tools, making it
              easy to plug into any workflow and collaborate across platforms
            </p>
          </motion.div>

          <div className="h-[400px] lg:h-[600px] mt-8 lg:mt-0 grid md:grid-cols-2 gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,_transparent_0%,_black_10%,_black_90%,_transparent_100%)]">
            <IntegrationColumn integrations={integrations} />
            <IntegrationColumn
              reverse
              integrations={integrations.slice().reverse()}
              className="hidden md:flex"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function IntegrationColumn(props: {
  integrations: IntegrationType;
  className?: string;
  reverse?: boolean;
}) {
  const { integrations, className, reverse } = props;

  return (
    <motion.div
      initial={{
        y: reverse ? "-50%" : 0,
      }}
      animate={{ y: reverse ? 0 : "-50%" }}
      transition={{
        duration: 20,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
        repeatType: "reverse",
      }}
      className={twMerge("flex flex-col gap-4 pb-4", className)}
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <Fragment key={index}>
          {integrations.map((integration) => {
            const IconComponent = integration.icon;
            return (
              <motion.div
                key={`${index}-${integration.name}`}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-center">
                  <IconComponent />
                </div>
                <h3 className="text-xl md:text-2xl text-center mt-4 font-medium text-[#154c79]">
                  {integration.name}
                </h3>
                <p className="text-center text-gray-600 mt-2 text-sm md:text-base">
                  {integration.description}
                </p>
              </motion.div>
            );
          })}
        </Fragment>
      ))}
    </motion.div>
  );
}

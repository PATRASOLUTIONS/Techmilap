"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const eventCategories = [
  {
    id: 1,
    title: "AI & ML EVENTS",
    eventCount: "8 Events",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Birthday_candles.jpg/330px-Birthday_candles.jpg",
    className: "col-span-1 row-span-1",
  },
  {
    id: 2,
    title: "WEB DEVELOPMENT",
    eventCount: "12 Events",
    image: "/placeholder.svg?height=500&width=800",
    className: "col-span-2 row-span-1",
  },
  {
    id: 3,
    title: "MOBILE APPS",
    eventCount: "6 Events",
    image: "/placeholder.svg?height=400&width=600",
    className: "col-span-1 row-span-1",
  },
  {
    id: 4,
    title: "BLOCKCHAIN & CRYPTO",
    eventCount: "5 Events",
    image: "/placeholder.svg?height=500&width=800",
    className: "col-span-2 row-span-1",
  },
  {
    id: 5,
    title: "CYBERSECURITY",
    eventCount: "7 Events",
    image: "/placeholder.svg?height=500&width=800",
    className: "col-span-2 row-span-1",
  },
];

export default function GalleryView() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-bold text-[#154c79] mb-6">
            Event Categories
          </h2>
          <p className="max-w-5xl leading-relaxed mx-auto text-lg text-gray-600">
            Discover exciting tech events and unforgettable experiences around
            our platform. Our community can arrange exclusive workshops and
            networking activities for you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {eventCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -0.5 }}
              className={`group cursor-pointer relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${category.className}`}
            >
              <div className="h-60 lg:h-80 overflow-hidden relative">
                <Image
                  src={category.image}
                  alt="/placeholder.svg"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* <div className="absolute top-4 right-4 z-10">
                  <span className="bg-[#b8860b] rounded-full text-sm px-3 py-1 text-white shadow-lg font-semibold ">
                    {category.title}
                  </span>
                </div> */}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// export default function GalleryView() {
//   return (
//     <section className="py-24 bg-gradient-to-b from-blue-50 to-purple-50">
//       <div className="container mx-auto px-4 max-w-7xl">
//         {/* Section Header */}
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           viewport={{ once: true }}
//           className="text-center mb-16"
//         >
//           <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#154c79] mb-6">Event Categories</h2>
//           <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
//             Discover exciting tech events and unforgettable experiences around our platform. Our community can arrange
//             exclusive workshops and networking activities for you.
//           </p>
//         </motion.div>

//         {/* Gallery Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
//           {eventCategories.map((category, index) => (
//             <motion.div
//               key={category.id}
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: index * 0.1 }}
//               viewport={{ once: true }}
//               whileHover={{ scale: 1.02, y: -5 }}
//               className={`group cursor-pointer relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${category.className}`}
//             >
//               {/* Background Image */}
//               <div className="relative h-64 lg:h-80 overflow-hidden">
//                 <Image
//                   src={category.image || "/placeholder.svg"}
//                   alt={category.title}
//                   fill
//                   className="object-cover transition-transform duration-700 group-hover:scale-110"
//                 />

//                 {/* Gradient Overlay */}
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

//                 {/* Event Count Badge */}
//                 <div className="absolute top-4 right-4 z-10">
//                   <span className="bg-[#b8860b] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
//                     {category.eventCount}
//                   </span>
//                 </div>

//                 {/* Content */}
//                 <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
//                   <h3 className="text-white font-bold text-xl lg:text-2xl mb-2 transform transition-transform duration-300 group-hover:translate-y-[-4px]">
//                     {category.title}
//                   </h3>

//                   {/* Hidden button that appears on hover */}
//                   <motion.button
//                     initial={{ opacity: 0, y: 20 }}
//                     whileHover={{ scale: 1.05 }}
//                     className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium
//                              border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300
//                              hover:bg-white/30"
//                   >
//                     Explore Events
//                   </motion.button>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>

//         {/* Call to Action */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.5 }}
//           viewport={{ once: true }}
//           className="text-center mt-16"
//         >
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             className="bg-gradient-to-r from-[#154c79] to-[#5e348a] text-white px-10 py-4 rounded-full
//                       font-semibold text-lg tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl"
//           >
//             View All Categories
//           </motion.button>
//         </motion.div>
//       </div>
//     </section>
//   )
// }

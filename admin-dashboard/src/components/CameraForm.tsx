import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Box, Button, FormControl, FormLabel, Input, Select, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import axios from 'axios'

interface CameraFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraAdded: () => void;
}

export default function CameraForm({ isOpen, onClose, onCameraAdded }: CameraFormProps) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    location: '',
    type: 'cobot'
  })

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault()
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/cameras`, formData)
      toast({ title: 'Camera added', status: 'success' })
      onCameraAdded()
      onClose()
      setFormData({ id: '', name: '', location: '', type: 'cobot' })
    } catch (error) {
      toast({ title: 'Error adding camera', status: 'error' })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Camera</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <FormControl mb={3}>
              <FormLabel>Camera ID</FormLabel>
              <Input 
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Name</FormLabel>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Location</FormLabel>
              <Input 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Type</FormLabel>
              <Select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="cobot">Cobot Safety</option>
                <option value="machine">Machine Safety</option>
                <option value="ppe">PPE Compliance</option>
              </Select>
            </FormControl>
            <Button type="submit" colorScheme="blue" mr={3}>Add Camera</Button>
            <Button onClick={onClose}>Cancel</Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
